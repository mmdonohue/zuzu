declare module 'eventsource-parser' {
    export interface ParsedEvent {
      type: 'event';
      data: string;
      event?: string;
      id?: string;
    }
  
    export interface ReconnectInterval {
      type: 'reconnect-interval';
      value: number;
    }
  
    export type EventSourceParserEvent = ParsedEvent | ReconnectInterval;

    type ParserCallbacks = {
      onEvent: (event: EventSourceParserEvent) => void;
      onError?: (error: Error) => void;
    }
  
    // Updated type signature for createParser
    export function createParser(
      callbacks: ParserCallbacks
    ): {
      feed: (chunk: string) => void;
      reset: () => void;
    };
  }