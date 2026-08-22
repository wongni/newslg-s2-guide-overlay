import { JsonUserRepository } from './json-user-repository';
import { JsonAuthCodeRepository } from './json-auth-code-repository';
import { JsonGuideRepository } from './json-guide-repository';
import { JsonReactionRepository } from './json-reaction-repository';
import { JsonReportRepository } from './json-report-repository';
import { JsonScoutRepository } from './json-scout-repository';
import { JsonMyDeckRepository } from './json-my-deck-repository';

export const userRepository = new JsonUserRepository();
export const authCodeRepository = new JsonAuthCodeRepository();
export const guideRepository = new JsonGuideRepository();
export const reactionRepository = new JsonReactionRepository();
export const reportRepository = new JsonReportRepository();
export const scoutRepository = new JsonScoutRepository();
export const myDeckRepository = new JsonMyDeckRepository();

export type {
  User,
  CreateUserInput,
  UserRepository,
  AuthCode,
  AuthCodeRepository,
  SharedGuide,
  CreateGuideInput,
  ListGuidesOptions,
  GuideRepository,
  Reaction,
  ReactionRepository,
  Report,
  ReportRepository,
  ScoutData,
  ScoutRepository,
  EnemyDeck,
  EnemyPlayer,
  ScoutVerdict,
  ScoutReinforcement,
  ScoutTroopType,
  EnemyArmy,
  UpsertEnemyDeckInput,
  UpsertEnemyPlayerInput,
  MyDeckEntry,
  MyDeckSettingsData,
  MyDeckRepository,
} from './types';
