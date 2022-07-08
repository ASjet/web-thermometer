import smtplib
from email.mime.text import MIMEText
import RPi.GPIO as GPIO

import config
from db import Data

init_flag = False


def init_led():
    global init_flag
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(2, GPIO.OUT)
    GPIO.setup(17, GPIO.OUT)
    init_flag = True


def led(data: Data):
    if not init_flag:
        init_led()

    if int(data.humi) > int(config.humi_threshold):
        GPIO.output(2, GPIO.HIGH)
    else:
        GPIO.output(2, GPIO.LOW)

    if int(data.temp) > int(config.temp_threshold):
        GPIO.output(17, GPIO.HIGH)
    else:
        GPIO.output(17, GPIO.LOW)


def send_mail(server, src, passwd, dst_list, text):
    if(len(dst_list) > 0):
        try:
            msg = MIMEText(text, "plain", "utf-8")
            smtp = smtplib.SMTP_SSL(server["server"].encode(), server["port"])
            smtp.login(src, passwd)
            smtp.sendmail(src, dst_list, msg.as_bytes())
            print('发送成功')
        except:
            print('发送失败')
        finally:
            smtp.quit()


def send_qqemail(dst_list, text):
    send_mail(config.server_list["qq_mail"], config.email_account,
              config.email_passwd, dst_list, text)


def subscribe_email(email):
    print(f"New subscribe email: {email}")
    text = "你已订阅温湿度信息"
    send_qqemail([email], text)


def unsubscribe_email(email):
    print(f"{email} has unsubscribed")
    text = "你已取消订阅温湿度信息"
    send_qqemail([email], text)
