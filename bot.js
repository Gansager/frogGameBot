require('dotenv').config();
const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const server = express();
const bot = new TelegramBot(TOKEN, { polling: true });

const port = process.env.PORT || 5001;
const gameName = "frogGame"; // Используйте короткое имя, созданное через BotFather
const queries = {};

// Укажите директорию со статическими файлами (если игра расположена в папке "public")
server.use(express.static(path.join(__dirname, 'public')));

// Команда для получения помощи
bot.onText(/help/, (msg) => {
    bot.sendMessage(msg.from.id, "Этот бот запускает игру Frog Jump. Используйте /game для начала.");
});

// Команда для запуска игры
bot.onText(/start|game/, (msg) => {
    bot.sendGame(msg.from.id, gameName);
});

// Обработка callback_query
bot.on("callback_query", (query) => {
    if (query.game_short_name !== gameName) {
        bot.answerCallbackQuery(query.id, { text: "Извините, эта игра недоступна." });
    } else {
        queries[query.id] = query;
        const gameURL = "https://gansager.github.io/frogGame/"; // Укажите URL вашей игры
        bot.answerCallbackQuery({
            callback_query_id: query.id,
            url: gameURL
        });
    }
});

// Обработка inline_query для игры
bot.on("inline_query", (iq) => {
    bot.answerInlineQuery(iq.id, [{
        type: "game",
        id: "0",
        game_short_name: gameName
    }]);
});

// Установка рекорда игры
server.get("/highscore/:score", (req, res, next) => {
    if (!Object.hasOwnProperty.call(queries, req.query.id)) return next();
    let query = queries[req.query.id];
    let options;

    if (query.message) {
        options = {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id
        };
    } else {
        options = {
            inline_message_id: query.inline_message_id
        };
    }

    bot.setGameScore(query.from.id, parseInt(req.params.score), options, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error setting score");
        }
        res.status(200).send("Score set successfully");
    });
});

// Запуск сервера
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
