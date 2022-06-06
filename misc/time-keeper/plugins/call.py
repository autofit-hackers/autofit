from slackbot.bot import respond_to

from .time_master import summarize_month

@respond_to('')
def make_summary(message):
    recv = message.body['text']
    year, month = [int(x.strip()) for x in recv.split(',')]

    text = summarize_month(year, month)
    message.reply(text)
