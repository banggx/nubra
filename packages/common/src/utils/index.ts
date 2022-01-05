import short from "short-uuid";
import qs from "qs";

export const uuid = short('0123456789');

export function parseLocationQuery() {
  return qs.parse(location.search, { ignoreQueryPrefix: true }) as Record<string, string>;
}