/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Message role types
 */
export type MessageRole = "user" | "assistant" | "tool" | "system";

/**
 * Base interface for all content types
 */
export interface BaseContent {
  type: string;
}

/**
 * Text content in a message
 */
export interface TextContent extends BaseContent {
  type: "text";
  text: string;
}

/**
 * Thinking content in a message (extended thinking/reasoning)
 */
export interface ThinkingContent extends BaseContent {
  type: "thinking";
  thinking: string;
  signature?: string | null;
}

/**
 * Tool use content (tool call request)
 */
export interface ToolUseContent extends BaseContent {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, any>;
  is_server_tool_use?: boolean;
}

/**
 * Tool result content (tool call response)
 */
export interface ToolResultContent extends BaseContent {
  type: "tool_result";
  id: string;
  content: Array<TextContent | FileContent>;
}

/**
 * File content in a message
 */
export interface FileContent extends BaseContent {
  type: "file";
  file: any; // File type - keeping generic for now
}

/**
 * Union type of all possible content types
 */
export type MessageContent =
  | TextContent
  | ThinkingContent
  | ToolUseContent
  | ToolResultContent
  | FileContent;

/**
 * A message in a conversation with an LLM.
 *
 * This handles messages for both OpenAI and Anthropic formats.
 */
export interface Message {
  /**
   * The role of the message sender
   */
  role: MessageRole;

  /**
   * The content of the message, which can include text and tool interactions
   */
  content: MessageContent[];
}
