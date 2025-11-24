/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Run status types
 */
export type RunStatus = "success" | "error" | "pending" | "running";

/**
 * Base interface for all timbal events yielded during flow execution.
 */
export interface BaseEvent {
  /**
   * The type of the event. This will be very useful for serializing and deserializing events.
   */
  type: string;

  /**
   * The id of the run this event was emitted from.
   */
  run_id: string;

  /**
   * The id of the parent run (if any).
   */
  parent_run_id: string | null;

  /**
   * The path of the element that yielded this event.
   */
  path: string;

  /**
   * The id of the single execution in a run.
   */
  call_id: string;

  /**
   * The id of the parent call if this event comes from a nested runnable.
   */
  parent_call_id: string | null;
}

/**
 * Event emitted when a step starts execution.
 */
export interface StartEvent extends BaseEvent {
  type: "START";

  /**
   * Optional user-facing text describing the action the step is performing.
   *
   * Intended for display in UIs to show agent activity, e.g.,
   * "Thinking...", "Searching the web...", "Running tool: get_weather".
   */
  status_text?: string | null;
}

/**
 * Event emitted when a chunk of data is received.
 *
 * @deprecated ChunkEvents will be deprecated in a future release. Use DeltaEvents instead
 * for structured, typed streaming with semantic information about different
 * content types (text, tool calls, thinking, etc.).
 *
 * Enable DeltaEvents by setting TIMBAL_DELTA_EVENTS=true.
 *
 * ChunkEvents provide simple untyped streaming events but lack the structure
 * and observability benefits of the newer DeltaEvent system.
 */
export interface ChunkEvent extends BaseEvent {
  type: "CHUNK";

  /**
   * Untyped chunk of output data (can be any type).
   *
   * @deprecated This untyped approach will be replaced by DeltaEvent's
   * structured delta format which provides semantic information.
   */
  chunk: any;
}

/**
 * Event emitted when a step completes with its full output.
 */
export interface OutputEvent extends BaseEvent {
  type: "OUTPUT";

  /**
   * The input arguments passed to the runnable.
   */
  input: any;

  /**
   * The status summary of the runnable after it completed.
   */
  status: RunStatus;

  /**
   * The result of the runnable.
   */
  output: any;

  /**
   * The error that occurred during the runnable.
   */
  error: any;

  /**
   * The start time of the runnable in milliseconds.
   */
  t0: number;

  /**
   * The end time of the runnable in milliseconds.
   */
  t1: number;

  /**
   * The usage of the runnable.
   */
  usage: Record<string, number>;

  /**
   * Additional metadata about the runnable.
   */
  metadata: Record<string, any>;
}

/**
 * Delta event system for fine-grained streaming output.
 *
 * This module provides a structured event system for streaming LLM outputs with
 * rich semantic information. Unlike the simple ChunkEvent which only carries raw
 * data, DeltaEvents provide typed, structured information about different types
 * of content being streamed (text, tool calls, thinking, etc.).
 *
 * The delta event system is enabled via the TIMBAL_DELTA_EVENTS environment variable
 * and provides better observability and control over streaming LLM responses.
 */

/**
 * Base interface for delta items
 */
export interface DeltaItem {
  id: string;
  type: string;
}

/**
 * Tool use delta item (start of a tool call)
 */
export interface ToolUseDeltaItem extends DeltaItem {
  type: "tool_use";
  name: string;
  input: string;
  is_server_tool_use?: boolean;
}

/**
 * Tool use delta item (incremental update to tool call input)
 */
export interface ToolUseDeltaDeltaItem extends DeltaItem {
  type: "tool_use_delta";
  input_delta: string;
}

/**
 * Text delta item (complete text block)
 */
export interface TextDeltaItem extends DeltaItem {
  type: "text";
  text: string;
}

/**
 * Text delta item (incremental text update)
 */
export interface TextDeltaDeltaItem extends DeltaItem {
  type: "text_delta";
  text_delta: string;
}

/**
 * Thinking delta item (complete thinking block)
 */
export interface ThinkingDeltaItem extends DeltaItem {
  type: "thinking";
  thinking: string;
}

/**
 * Thinking delta item (incremental thinking update)
 */
export interface ThinkingDeltaDeltaItem extends DeltaItem {
  type: "thinking_delta";
  thinking_delta: string;
}

/**
 * Custom delta item (arbitrary data)
 */
export interface CustomDeltaItem extends DeltaItem {
  type: "custom";
  data: any;
}

/**
 * Content block stop marker
 */
export interface ContentBlockStopDeltaItem extends DeltaItem {
  type: "content_block_stop";
}

/**
 * Union type of all delta items
 */
export type DeltaItemType =
  | ToolUseDeltaItem
  | ToolUseDeltaDeltaItem
  | TextDeltaItem
  | TextDeltaDeltaItem
  | ThinkingDeltaItem
  | ThinkingDeltaDeltaItem
  | CustomDeltaItem
  | ContentBlockStopDeltaItem;

/**
 * Delta event for fine-grained streaming
 */
export interface DeltaEvent extends BaseEvent {
  type: "DELTA";
  item: DeltaItemType;
}

/**
 * Union type of all possible events
 */
export type TimbalEvent = StartEvent | ChunkEvent | OutputEvent | DeltaEvent;

/**
 * Type guard to check if an event is a StartEvent
 */
export function isStartEvent(event: TimbalEvent): event is StartEvent {
  return event.type === "START";
}

/**
 * Type guard to check if an event is a ChunkEvent
 * @deprecated ChunkEvents are deprecated. Use DeltaEvents instead.
 */
export function isChunkEvent(event: TimbalEvent): event is ChunkEvent {
  return event.type === "CHUNK";
}

/**
 * Type guard to check if an event is an OutputEvent
 */
export function isOutputEvent(event: TimbalEvent): event is OutputEvent {
  return event.type === "OUTPUT";
}

/**
 * Parse a JSON string into a TimbalEvent
 * @param json The JSON string to parse
 * @returns The parsed TimbalEvent
 * @throws Error if the JSON is invalid or doesn't match the event schema
 */
export function parseEvent(json: string): TimbalEvent {
  try {
    const parsed = JSON.parse(json);

    // Basic validation
    if (!parsed.type || !parsed.run_id || !parsed.path || !parsed.call_id) {
      throw new Error("Invalid event: missing required fields");
    }

    // Validate event type
    if (
      parsed.type !== "START" &&
      parsed.type !== "CHUNK" &&
      parsed.type !== "OUTPUT" &&
      parsed.type !== "DELTA"
    ) {
      throw new Error(`Unknown event type: ${parsed.type}`);
    }

    // Warn about deprecated CHUNK events
    if (parsed.type === "CHUNK") {
      console.warn(
        "[DEPRECATED] ChunkEvent received. ChunkEvents will be deprecated in a future release.\n" +
          "Please migrate to DeltaEvents for structured, typed streaming with better observability.\n" +
          "Enable DeltaEvents by setting TIMBAL_DELTA_EVENTS=true.",
      );
    }

    return parsed as TimbalEvent;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse event JSON: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parse multiple events from a newline-delimited JSON string
 * @param ndjson The newline-delimited JSON string
 * @returns Array of parsed TimbalEvents
 */
export function parseEvents(ndjson: string): TimbalEvent[] {
  const lines = ndjson.split("\n").filter((line) => line.trim().length > 0);
  return lines.map((line) => parseEvent(line));
}
