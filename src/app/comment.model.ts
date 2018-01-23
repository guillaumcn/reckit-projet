/**
 * Created by christianpagh-birk on 23/01/2018.
 */

export class Comment {
  textQuestion: string;
  date: number; //timestamp
  questioner: string;
  answers?: {answerer: string, date: number, textAnswer: string}[];

  // ? -> param facultatif
  constructor(textQuestion?: string, date?: number, questioner?: string) {
    // s'il est défini : textQuestion, sinon ''
    this.textQuestion = textQuestion || '';
    this.date = date || 0;
    this.questioner = questioner || '';
    this.answers = [];
  }
}
