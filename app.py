import json
from threading import Thread

from flask import Flask, request, render_template

import config
from db import History
from sensor import read_data_loop, loop_email
from action import subscribe_email, unsubscribe_email

app = Flask(__name__)


# 主界面
@app.route("/")
def index():
    return render_template('index.html')


# 最近amount条历史数据
@app.route("/recent", methods=["POST"])
def fetch_recent():
    db = History()
    args: dict = request.json
    # 若未指定amount参数则默认返回最近10条数据
    amount = args.get("amount", 10)
    return json.dumps(db.retrive_recent(amount))


# 时间区间数据
@app.route("/interval", methods=["POST"])
def fetch_interval():
    db = History()
    args: dict = request.json
    time_start = args["start"]
    time_stop = args["stop"]
    return json.dumps(db.retrive_interval(time_start, time_stop))


# 设置温湿度阈值
@app.route("/threshold", methods=["POST", "GET"])
def thres():
    if request.method == "POST":
        # POST
        args: dict = request.json
        config.temp_threshold = float(args["temp"])
        config.humi_threshold = float(args["humi"])
        print(config.temp_threshold, config.humi_threshold)
        return json.dumps({"temp": config.temp_threshold,
                           "humi": config.humi_threshold})
    else:
        # GET
        return json.dumps({
            "temp": config.temp_threshold,
            "humi": config.humi_threshold
        })


# 邮件订阅/退订
@app.route("/email", methods=["POST"])
def email():
    args: dict = request.json
    email = args["email"]
    subscribe = args["subscribe"]
    if subscribe:
        if email not in config.subscribe_list:
            config.subscribe_list.append(email)
            subscribe_email(email)
            return json.dumps({"success": True})
        else:
            return json.dumps({"success": False})
    else:
        if email in config.subscribe_list:
            config.subscribe_list.remove(email)
            unsubscribe_email(email)
            return json.dumps({"success": True})
        else:
            return json.dumps({"success": False})


def run_sensor(sample_duration: int = 1):
    read_thread = Thread(target=read_data_loop,
                         kwargs={"delay": sample_duration})
    read_thread.start()


def send_email(sample_duration: int = 1):
    read_thread = Thread(target=loop_email,
                         kwargs={"delay": sample_duration})
    read_thread.start()


def main():
    # 运行邮件发送线程，每30秒发送一次
    send_email(30)
    # 运行数据采集线程，每2秒采集一次
    run_sensor(2)

    # 运行后端线程
    app.run(host='127.0.0.1', port=20000, debug=False,
            threaded=True)


if __name__ == '__main__':
    main()
