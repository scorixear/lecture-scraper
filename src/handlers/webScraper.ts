import puppeteer from 'puppeteer'
import { Browser } from 'puppeteer'
export class Module {
  public id: string;
  public professor: string;
  public lecturers: string[];
  public lectures: Lecture[];
  public displayName: string;

  private constructor(id: string, professor: string, lectures: Lecture[], displayName: string, lecturers: string[] = []) {
    this.id = id;
    this.professor = professor;
    this.lecturers = lecturers;
    this.lectures = lectures;
    this.displayName = displayName;
  }
}

export class Lecture {
  public type: LectureType;
  public time?: string;
  public day: string;
  public place: string;
  public group?: string;

  private constructor(type: LectureType, day: string, place: string, time?: string, group?: string)
  {
    this.type = type;
    this.time = time;
    this.day = day;
    this.place = place;
    this.group = group;
  }
}

export enum LectureType {
  Lecture = "Vorlesung",
  Seminar = "Seminar",
  Internship = "Praktikum",
  Exercise = "Übung"
}


export class WebScraper {
  private browser?: Browser;
  public async init() { 
    this.browser = await puppeteer.launch();
  }
  public async scrapeLectures(url: string): Promise<Array<Module> | undefined> {
    if (!this.browser) return undefined;
    const page = await this.browser?.newPage();
    await page?.goto(url);
    const modules = await page?.$$('n-studgang-unit');
    return undefined;
  }
}