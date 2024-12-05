import { Module } from "@nestjs/common";
import { SheetsService } from "./sheets.service";
import { SheetsSchedulerService } from "./sheets-scheduler.service";

@Module({
  providers: [SheetsService, SheetsSchedulerService],
  exports: [SheetsService, SheetsSchedulerService],
})
export class SheetsModule {}
