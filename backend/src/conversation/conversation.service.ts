import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message, SenderType } from './entities/message.entity';
import { AppUserService } from '../app-user/app-user.service';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private appUserService: AppUserService,
    private dataSource: DataSource,
  ) {}

  async createConversation(appUserId: string) {
    const appUser = await this.appUserService.getAppUser(appUserId);

    if (!appUser) {
      throw new NotFoundException('App user not found');
    }

    const conversation = this.conversationRepository.create({
      appUser,
    });

    return this.conversationRepository.save(conversation);
  }

  async createMessageResponsePair(conversationId: string, message: string) {
    const conversation = await this.getConversation(conversationId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const response = this.getResponse();

    return await this.saveMessageResponsePair(
      conversationId,
      message,
      response,
    );
  }

  private async getConversation(conversationId: string) {
    return await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
  }

  // TODO: TEMPORARY method to get a response; will be replaced with actual AI response
  private getResponse() {
    return 'This is a test response';
  }

  private async saveMessageResponsePair(
    conversationId: string,
    message: string,
    response: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userMsg = this.messageRepository.create({
        conversation: { id: conversationId },
        content: message,
        senderType: SenderType.USER,
      });

      const botMsg = this.messageRepository.create({
        conversation: { id: conversationId },
        content: response,
        senderType: SenderType.BOT,
      });

      await queryRunner.manager.save(userMsg);
      await queryRunner.manager.save(botMsg);

      await queryRunner.commitTransaction();
      return [userMsg, botMsg];
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
