/**
 * Created by christianpagh-birk on 23/01/2018.
 */

export class Comment {
  textQuestion: string;
  date: number; //timestamp
  questioner: string;
  answers: {answerer:string, date:number, textAnswer:string}[];

  constructor() {
    this.textQuestion = '';
    this.date = 0;
    this.questioner = '';
    this.answers = [];
  }
}
