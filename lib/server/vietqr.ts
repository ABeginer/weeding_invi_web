function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function sanitizeContent(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 25);
}

export function buildVietQrPayload(input: {
  bin: string;
  accountNo: string;
  amount: number;
  content: string;
}): string {
  const consumer = tlv("00", input.bin) + tlv("01", input.accountNo);
  const merchant =
    tlv("00", "A000000727") + tlv("01", consumer) + tlv("02", "QRIBFTTA");

  const body =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("38", merchant) +
    tlv("53", "704") +
    tlv("54", String(input.amount)) +
    tlv("58", "VN") +
    tlv("62", tlv("08", sanitizeContent(input.content))) +
    "6304";

  return body + crc16(body);
}
