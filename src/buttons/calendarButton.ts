import { ButtonInteraction, CacheType, GuildMember, GuildMemberRoleManager } from 'discord.js';
import { ButtonInteractionModel, Logger, MessageHandler } from 'discord.ts-architecture';
import LanguageHandler from '../handlers/languageHandler';
import { createEvents, EventAttributes } from 'ics';
import { sqlClient } from '../handlers/sqlHandler';
import fs from 'fs';
import { Lecture, Lecturer, LectureType, Module } from '@prisma/client';

export class CalendarButton extends ButtonInteractionModel {
  constructor(id: string) {
    super(id, 2000, true);
  }

  override async handle(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
      super.handle(interaction);
    } catch {
      return;
    }
    Logger.info('Creating calender for ' + (interaction.member as GuildMember | undefined)?.displayName);
    const roles = (interaction.member?.roles as GuildMemberRoleManager | undefined)?.cache;
    const uni_ids: string[] = [];
    for (const role of roles ?? []) {
      const sqlUni = await sqlClient.getRole(role[1].id);
      if (sqlUni) {
        uni_ids.push(sqlUni.uni_id);
      }
    }
    Logger.info(`Found ${uni_ids.length} uni_ids for ` + (interaction.member as GuildMember | undefined)?.displayName);
    const semester = await sqlClient.getConfig('semester');
    const sqlStart = await sqlClient.getConfig('startdate');
    const sqlEnd = await sqlClient.getConfig('enddate');
    const startDate = new Date(parseInt(sqlStart ? sqlStart.value ?? '0' : '0'));
    const endDate = new Date(parseInt(sqlEnd ? sqlEnd.value ?? '0' : '0'));
    if (!semester || !semester.value) {
      Logger.warn(
        'Semester Configuration not found for ' + (interaction.member as GuildMember | undefined)?.displayName
      );
      return;
    }

    const modules: (Module & { lecturers: Lecturer[]; lectures: Lecture[] })[] = [];
    for (const uni_id of uni_ids) {
      const module = await sqlClient.getModule(semester.value, uni_id);
      if (module) {
        modules.push(module);
      }
    }

    Logger.info(`Found ${modules.length} modules for ` + (interaction.member as GuildMember | undefined)?.displayName);

    const value = await new Promise<string | undefined>((resolve, reject) => {
      const events: EventAttributes[] = [];
      modules.forEach((module) => {
        module.lectures.forEach((lecture) => {
          // if time is not set or day is not set or time does not match (10:00-10:00) or (-) denoting a full day
          if (!lecture.time || !lecture.day || (!lecture.time.match(/\d\d:\d\d-\d\d:\d\d/g) && lecture.time !== '-')) {
            return;
          }
          // defines the difference that is subtracted from the start date
          let dayDiff = 0;
          let startYear = startDate.getFullYear();
          let startMonth = startDate.getMonth() + 1;
          // day is calculated later
          let startDay = undefined;
          // undefined means full day event
          let startHour = undefined;
          let startMinute = undefined;
          // end date is
          let endYear = startDate.getFullYear();
          let endMonth = startDate.getMonth() + 1;
          // day is calculated later
          let endDay = undefined;
          // undefined means full day event
          let endHour = undefined;
          let endMinute = undefined;

          let dayOfWeek;
          let recurrenceRule;

          // convert day to dayDiff (current Day of Month - Translation is a number from -6 until +6)
          if (lecture.day.startsWith('montags')) {
            dayOfWeek = 'MO';
            dayDiff = startDate.getDay() - 1;
          } else if (lecture.day.startsWith('dienstags')) {
            dayOfWeek = 'TU';
            dayDiff = startDate.getDay() - 2;
          } else if (lecture.day.startsWith('mittwochs')) {
            dayOfWeek = 'WE';
            dayDiff = startDate.getDay() - 3;
          } else if (lecture.day.startsWith('donnerstags')) {
            dayOfWeek = 'TH';
            dayDiff = startDate.getDay() - 4;
          } else if (lecture.day.startsWith('freitags')) {
            dayOfWeek = 'FR';
            dayDiff = startDate.getDay() - 5;
            // if day is a time diff
          } else if (lecture.day.match(/\d\d\.\d\d\.\d\d\d\d - \d\d\.\d\d\.\d\d\d\d/g)) {
            // read in start day
            startYear = parseInt(lecture.day.split(' - ')[0].split('.')[2]);
            startMonth = parseInt(lecture.day.split(' - ')[0].split('.')[1]);
            startDay = parseInt(lecture.day.split(' - ')[0].split('.')[0]);
            // configure end day to be same day if lecture time is given
            const copyDate = new Date(startYear, startMonth - 1, startDay);
            const recurrenceDate = new Date(
              parseInt(lecture.day.split(' - ')[1].split('.')[2]),
              parseInt(lecture.day.split(' - ')[1].split('.')[1]) - 1,
              parseInt(lecture.day.split(' - ')[1].split('.')[0])
            );
            // if not given, configure to be full-day event
            if (lecture.time === '-') {
              copyDate.setDate(copyDate.getDate() + 1);
            } else {
              recurrenceDate.setDate(recurrenceDate.getDate() + 1);
            }
            // set enddate
            endYear = copyDate.getFullYear();
            endMonth = copyDate.getMonth() + 1;
            endDay = copyDate.getDate();
            // parse end event
            // set reccurenceRule to be event timespan
            recurrenceRule = `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;INTERVAL=1;UNTIL=${recurrenceDate.getFullYear()}${
              recurrenceDate.getMonth() < 9 ? '0' + (recurrenceDate.getMonth() + 1) : recurrenceDate.getMonth() + 1
            }${recurrenceDate.getDate() < 10 ? '0' + recurrenceDate.getDate() : recurrenceDate.getDate()}T000000Z`;
            // if format is single day
          } else if (lecture.day.match(/\d\d\.\d\d\./g)) {
            // read in start day
            startMonth = parseInt(lecture.day.split('.')[1]);
            startDay = parseInt(lecture.day.split('.')[0]);
            // set end day to be same day if lecture time is given
            const copyDate = new Date(startYear, startMonth - 1, startDay);
            const recurrenceDate = new Date(startYear, startMonth - 1, startDay);
            // if not given, configure to be full-day event
            if (lecture.time === '-') {
              copyDate.setDate(copyDate.getDate() + 1);
            } else {
              recurrenceDate.setDate(recurrenceDate.getDate() + 1);
            }
            // set enddate
            endYear = copyDate.getFullYear();
            endMonth = copyDate.getMonth() + 1;
            endDay = copyDate.getDate();

            // parse end event
            // set reccurenceRule to be event timespan
            recurrenceRule = `FREQ=DAILY;INTERVAL=1;UNTIL=${recurrenceDate.getFullYear()}${
              recurrenceDate.getMonth() < 9 ? '0' + (recurrenceDate.getMonth() + 1) : recurrenceDate.getMonth() + 1
            }${recurrenceDate.getDate() < 10 ? '0' + recurrenceDate.getDate() : recurrenceDate.getDate()}T000000Z`;
            // format is not understandable, skip this event
          } else {
            return;
          }

          if (!recurrenceRule) {
            recurrenceRule = `FREQ=WEEKLY;BYDAY=${dayOfWeek};INTERVAL=1;UNTIL=${endDate.getFullYear()}${
              endDate.getMonth() < 9 ? '0' + (endDate.getMonth() + 1) : endDate.getMonth() + 1
            }${endDate.getDate() < 10 ? '0' + endDate.getDate() : endDate.getDate()}T000000Z`;
          }

          // if day is not already set by the time range value
          if (!startDay) {
            // add difference to date resulting in next day in the coming week (or current week) as long as it is this month
            startDay = startDate.getDate() - dayDiff;
            // if the calculated diff is below 0, add 7 days (since difference calculated is max 6)
            if (startDay < 1) {
              startDay += 7;
            }
            // set the end day the same, since hours are the denoting factor
            endDay = startDay;
          }

          // calculate the start and end time (if this is following the regex)
          if (lecture.time.match(/\d\d:\d\d-\d\d:\d\d/g)) {
            startHour = parseInt(lecture.time.split('-')[0].split(':')[0]);
            startMinute = parseInt(lecture.time.split('-')[0].split(':')[1]);
            endHour = parseInt(lecture.time.split('-')[1].split(':')[0]);
            endMinute = parseInt(lecture.time.split('-')[1].split(':')[1]);
            // if the regex is not matching means full day event, if we haven't already set the days above
          } else if (
            !lecture.day.match(/\d\d\.\d\d\.\d\d\d\d - \d\d\.\d\d\.\d\d\d\d/g) &&
            !lecture.day.match(/\d\d\.\d\d\./g)
          ) {
            // copy the date to add one day (full day events), this will possibly change the month value or year value
            const copyDate = new Date(startDate.getTime());
            copyDate.setDate(startDate.getDate() + 1);
            endYear = copyDate.getFullYear();
            endMonth = copyDate.getMonth() + 1;
            endDay = copyDate.getDate();
            startHour = undefined;
            startMinute = undefined;
            endHour = undefined;
            endMinute = undefined;
          }
          let start: [number, number, number] | [number, number, number, number, number];
          let end: [number, number, number] | [number, number, number, number, number];
          // if the startHour is set, this means we have a non-full-day event
          if (startHour) {
            start = [startYear, startMonth, startDay, startHour, startMinute ?? 0];
            end = [endYear, endMonth, endDay ?? 0, endHour ?? 0, endMinute ?? 0];
          } else {
            start = [startYear, startMonth, startDay];
            end = [endYear, endMonth, endDay ?? 0];
          }
          events.push({
            title: `${LectureTypeToString.get(lecture.type) ?? ''}: ${module.name}${
              lecture.group ? ' [' + lecture.group + ']' : ''
            }`,
            start: start,
            startInputType: 'local',
            startOutputType: 'local',
            end: end,
            endInputType: 'local',
            endOutputType: 'local',
            description: `ID: ${module.uni_id}\nProfessor: ${module.professor}`,
            location: `${lecture.place}`,
            status: 'CONFIRMED',
            categories: [lecture.type],
            busyStatus: 'BUSY',
            recurrenceRule: recurrenceRule
          });
        });
      });
      Logger.info(
        `Created ${events.length} events for ` + (interaction.member as GuildMember | undefined)?.displayName
      );
      createEvents(events, (error, value) => {
        if (error) reject(error);
        resolve(value);
      });
    });
    const lines = value?.split('\n') ?? [];
    lines.forEach((line, index) => {
      if (line.startsWith('DTSTART:')) {
        lines[index] = 'TZID:Europe/Berlin\n' + line;
      }
    });
    fs.writeFileSync(`./src/assets/${interaction.id}.ics`, lines.join('\n') ?? '');

    try {
      await MessageHandler.reply({
        interaction,
        title: LanguageHandler.language.buttons.calendar.success.title,
        description: LanguageHandler.language.buttons.calendar.success.description,
        files: [`./src/assets/${interaction.id}.ics`],
        ephemeral: true
      });
    } catch {
      Logger.error('Error sending calender', (interaction.member as GuildMember).displayName);
    } finally {
      fs.rmSync(`./src/assets/${interaction.id}.ics`);
    }
  }
}

export const StringToLectureType = new Map<string, LectureType>([
  ['Vorlesung', LectureType.Lecture],
  ['Seminar', LectureType.Seminar],
  ['Praktikum', LectureType.Internship],
  ['Übung', LectureType.Exercise]
]);

export const LectureTypeToString = new Map<LectureType, string>([
  [LectureType.Lecture, 'Vorlesung'],
  [LectureType.Seminar, 'Seminar'],
  [LectureType.Internship, 'Praktikum'],
  [LectureType.Exercise, 'Übung']
]);
