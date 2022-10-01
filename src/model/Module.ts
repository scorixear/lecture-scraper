import { Lecture } from './Lecture';

export class Module {
  public id: string;
  public professor?: string;
  public lecturers: string[];
  public lectures: Lecture[];
  public displayName: string;

  public constructor(
    id: string,
    displayName: string,
    professor?: string,
    lectures: Lecture[] = [],
    lecturers: string[] = []
  ) {
    this.id = id.trim();
    this.professor = professor?.trim();
    this.lecturers = lecturers.map((l) => l.trim());
    this.lectures = lectures;
    this.displayName = displayName.trim();
  }
}
