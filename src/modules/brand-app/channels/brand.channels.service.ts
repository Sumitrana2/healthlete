import * as preferredChannelsRepo from "./brand.channels.repository";

export async function getPreferredChannels() {
  return await preferredChannelsRepo.getAllPreferredChannels();
}