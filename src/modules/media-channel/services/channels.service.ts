import { Injectable } from "@nestjs/common";
import { ChannelsRepository } from "../repositories/channels.repository";

@Injectable()
export class ChannelsService {
  constructor(private readonly repository: ChannelsRepository) {}

  async getPreferredChannels() {
    return this.repository.getAllPreferredChannels();
  }
}
