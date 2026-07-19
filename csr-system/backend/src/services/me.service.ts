import { User } from "../models/User";
import { CandidateProfile } from "../models/CandidateProfile";
import { TrainerProfile } from "../models/TrainerProfile";
import { ApiError } from "../utils/ApiError";
import { generateRawToken } from "../utils/password";

export async function getOwnProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");

  if (user.roleCode === "candidate") {
    const profile = await CandidateProfile.findOne({ userId: user._id });
    return { user, profile };
  }
  if (user.roleCode === "trainer") {
    const profile = await TrainerProfile.findOne({ userId: user._id });
    return { user, profile };
  }
  return { user, profile: null };
}

export async function updateCandidateProfile(userId: string, updates: Record<string, unknown>) {
  const profile = await CandidateProfile.findOneAndUpdate({ userId }, { $set: updates }, { new: true, upsert: true });
  return profile;
}

export async function updateTrainerProfile(userId: string, updates: Record<string, unknown>) {
  const profile = await TrainerProfile.findOneAndUpdate({ userId }, { $set: updates }, { new: true, upsert: true });
  return profile;
}

/**
 * The candidate's personal attendance badge — rendered as a QR on their
 * dashboard for staff to scan. Lazily generated so profiles created before
 * this existed still get one on first request, no migration needed.
 */
export async function getOwnAttendanceQr(userId: string): Promise<string> {
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) throw ApiError.notFound("Candidate profile not found");

  if (profile.attendanceQrToken) return profile.attendanceQrToken;

  const token = generateRawToken();
  await CandidateProfile.updateOne({ userId }, { $set: { attendanceQrToken: token } });
  return token;
}

export async function regenerateOwnAttendanceQr(userId: string): Promise<string> {
  const profile = await CandidateProfile.findOne({ userId });
  if (!profile) throw ApiError.notFound("Candidate profile not found");

  const token = generateRawToken();
  await CandidateProfile.updateOne({ userId }, { $set: { attendanceQrToken: token } });
  return token;
}
