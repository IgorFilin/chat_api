import {
  IsEmail,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAllowedDomain', async: false })
export class IsAllowedDomain implements ValidatorConstraintInterface {
  validate(email: string, args: ValidationArguments) {
    // Получаем доменное имя из адреса электронной почты
    const [, domain] = email.split('@');

    // Проверяем, допустим ли домен
    return ['google.com', 'yandex.ru', 'mail.ru'].includes(domain);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Адрес электронной почты должен быть на домене google.com, yandex.ru или mail.ru';
  }
}
