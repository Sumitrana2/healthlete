import * as preferredChannelsRepo from "./admin.channels.repository";

export async function getPreferredChannels() {
  return await preferredChannelsRepo.getAllPreferredChannels();
}