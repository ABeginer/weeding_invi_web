declare module "qrcode" {
  export interface QRCodeRenderersOptions {
    version?: number;
    errorCorrectionLevel?: "low" | "medium" | "quartile" | "high" | "L" | "M" | "Q" | "H";
    maskPattern?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toCanvas(
    canvasElement: HTMLCanvasElement,
    text: string | QRCodeSegment[],
    options?: QRCodeRenderersOptions,
  ): Promise<void>;

  export function toCanvas(
    canvasElement: HTMLCanvasElement,
    text: string | QRCodeSegment[],
    callback: (error: Error | null | undefined) => void,
  ): void;

  export function toCanvas(
    canvasElement: HTMLCanvasElement,
    text: string | QRCodeSegment[],
    options: QRCodeRenderersOptions,
    callback: (error: Error | null | undefined) => void,
  ): void;

  export function toDataURL(
    text: string | QRCodeSegment[],
    options?: QRCodeRenderersOptions,
  ): Promise<string>;

  export function toString(
    text: string | QRCodeSegment[],
    options?: QRCodeRenderersOptions & { type?: "svg" | "utf8" },
  ): Promise<string>;

  export interface QRCodeSegment {
    data: string;
    mode?: string;
  }

  const qrcode: {
    toCanvas: typeof toCanvas;
    toDataURL: typeof toDataURL;
    toString: typeof toString;
  };

  export default qrcode;
}

