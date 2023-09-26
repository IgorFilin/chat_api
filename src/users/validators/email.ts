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
    const domains = [
      'google.com',
      'yandex.ru',
      'mail.ru',
      'gmail.com',
      'bk.ru',
    ];
    // Проверяем, допустим ли домен
    const isAllowedDomain = domains.includes(domain);
    return isAllowedDomain;
  }

  defaultMessage(args: ValidationArguments) {
    if (!args.value) {
      return 'Почта должна быть обязательно введена';
    }
    return 'Электронная почта данного домена не подходит для регистрации';
  }
}
