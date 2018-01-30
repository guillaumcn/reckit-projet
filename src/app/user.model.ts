export class User {
  displayName: string;
  email: string;
  followedTags?: string[];

  constructor() {
    this.displayName = '';
    this.email = '';
    this.followedTags = [];
  }
}
