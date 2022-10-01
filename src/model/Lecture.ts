import { LectureType } from './LectureType';

export class Lecture {
  public type: LectureType;
  public time?: string;
  public day: string;
  public place: string;
  public group?: string;

  public constructor(type: LectureType, day: string, place: string, time?: string, group?: string) {
    this.type = type;
    this.time = time?.trim();
    this.day = day.trim();
    this.place = place.trim();
    this.group = group?.trim();
  }

  public static getKeyByValue(value: string) {
    switch (value) {
      case LectureType.Lecture:
        return LectureType.Lecture;
      case LectureType.Exercise:
        return LectureType.Exercise;
      case LectureType.Internship:
        return LectureType.Internship;
      case LectureType.Seminar:
        return LectureType.Seminar;
      default:
        return undefined;
    }
  }
}
