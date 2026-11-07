// Pix "copia e cola" (BR Code estático, padrão EMV do Banco Central).
// Gera o payload com valor e identificador do pedido; o QR é desenhado a partir dele.

const field = (id: string, value: string) => id + String(value.length).padStart(2, "0") + value;

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const ascii = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase();

export function pixPayload(opts: {
  key: string;
  merchantName: string;
  merchantCity: string;
  amountCents: number;
  txid: string;
}) {
  const account = field("00", "br.gov.bcb.pix") + field("01", opts.key);
  const txid = opts.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const body =
    field("00", "01") +
    field("26", account) +
    field("52", "0000") +
    field("53", "986") +
    field("54", (opts.amountCents / 100).toFixed(2)) +
    field("58", "BR") +
    field("59", ascii(opts.merchantName).slice(0, 25)) +
    field("60", ascii(opts.merchantCity).slice(0, 15)) +
    field("62", field("05", txid)) +
    "6304";
  return body + crc16(body);
}
