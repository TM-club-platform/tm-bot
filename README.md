<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).

TODO LIST

- finish registration wizard
- add scene for anketa and etc
- add matching logic

<!-- ) Распиши приоритеты по мэтчингу. Можешь писать идеальный вариант, всё что будет сложно вынесу в отдельную задачу

1. Проверка, что такой пары еще не было среди всех пользователей в базе (старые и новые, которые появились с прошлого подбора)
2. Совпадение страны
3. Совпадение локации (город или район). Если нет актуальной пары для пользователя в этом районе, то метч с пользователем из другого ближайшего района (например, вместо Чангу Семеньяк)
4. Приоритет хештегов от большего веса к меньшему:

5. О чем интересно поговорить?
6. Увлечения
7. Вайб, какой ты человек -->

2) Распиши когда какие сообщения от бота должны приходить, типо каждый понедельник, каждый вторник, каждую среду блаблабла

Понедельник. Время: 10:00 по мск.

Текст: Сегодня стартует новый подбор пар. Планируешь участвовать на этой неделе?

Варианты кнопками:

— Участвую (участвует в подборе)
— Пропущу неделю (вопрос дублируется с пропуском этой недели)
— Пропущу месяц (пауза в подборе на месяц)

Сообщение текстом после опроса:

❗️Важно: если ты делаешь паузу в подборе, то подписка не продлевается.

Поэтому советуем попробовать встретиться со своим тревел-мейтом. А вдруг на этой неделе выпадает кто-то особенный? ☺️

Среда. Время: 10:00 мск

Сообщение текстом до опроса:

Осталось всего 2 часа, чтобы подтвердить участие!

— Участвую
— Пропущу неделю
— Пропущу месяц

Механика: Через 2 часа после сообщения пользователь не может участвовать в подборе.

Если человек не выбрал ни одного действия, то он не участвует в подборе на этой неделе. Такая же механика, как если бы человек выбрал “пропущу неделю”
На следующей неделе ему задаются те же вопросы.
Если выбрал “пропущу месяц”, то сообщение дублируется только через 4 недели.

3. скинь мне макеты анкет

https://drive.google.com/drive/folders/12aY4H3zpr4XHju7QKA_rZuYV-BksjN2F
