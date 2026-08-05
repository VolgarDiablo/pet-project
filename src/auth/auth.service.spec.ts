import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersDataService } from './users.data.service';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersDataService, useValue: {} },
        { provide: EmailService, useValue: { sendEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
