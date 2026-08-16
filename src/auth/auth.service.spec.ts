import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersDataService } from './users.data.service';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersDataService, useValue: {} },
        { provide: MailService, useValue: { sendVeryfiedEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
