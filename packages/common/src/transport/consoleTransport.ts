import { Transport } from "./baseTransport";
import { BaseReporter } from "../reporter";
import { ReportItem, BaseReportItem } from "../types";

export class ConsoleTransport extends Transport<BaseReporter> {
  send(records: ReportItem<BaseReportItem>[]) {
    records.forEach(record => {
      console.log(`[debug][${record.type}]${new Date(record.ctime).toLocaleString()}`, record.context, record.data);
    })
  }
}