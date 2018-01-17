export class User {
  displayName: string;
  email: string;
  followedTags: {};

  constructor() {
    this.displayName = '';
    this.email = '';
    this.followedTags = {};
  }
}
