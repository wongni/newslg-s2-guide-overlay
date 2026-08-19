import { JsonUserRepository } from './json-user-repository';
import { JsonAuthCodeRepository } from './json-auth-code-repository';
import { JsonGuideRepository } from './json-guide-repository';
import { JsonReactionRepository } from './json-reaction-repository';
import { JsonReportRepository } from './json-report-repository';

export const userRepository = new JsonUserRepository();
export const authCodeRepository = new JsonAuthCodeRepository();
export const guideRepository = new JsonGuideRepository();
export const reactionRepository = new JsonReactionRepository();
export const reportRepository = new JsonReportRepository();

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
} from './types';
