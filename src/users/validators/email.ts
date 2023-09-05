import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAllowedDomain', async: false })
export class IsAllowedDomain implements ValidatorConstraintInterface {
  validate(email: string, args: ValidationArguments) {
    if (!email) {
      return false;
    }
    // Получаем доменное имя из адреса электронной почты
    const [, domain] = email.split('@');
    args.constraints = [];
    // Проверяем, допустим ли домен
    const isAllowedDomain = [
      'google.com',
      'yandex.ru',
      'mail.ru',
      'gmail.com',
    ].includes(domain);
    return isAllowedDomain;
  }

  defaultMessage(args: ValidationArguments) {
    if (!args.value) {
      return 'Почта должна быть обязательно введена';
    }
    return 'Адрес электронной почты должен быть на домене google.com, yandex.ru или mail.ru';
  }
}
