import config
import time
import numpy as np
from db import Data, History
from action import led, send_qqemail
import Adafruit_DHT


rng = np.random.default_rng()
temp_base = 26
temp_factor = 5
humi_base = 50
humi_factor = 20


def gen_dummy_data() -> Data:
    temp = temp_base + temp_factor*rng.normal()
    humi = humi_base + temp_factor*rng.normal()
    return Data(round(temp, 1), round(humi, 1))


# 警报链
action_chain = [
    led,
]


def alert(data: Data):
    for action in action_chain:
        action(data)


def get_DHT_data() -> Data:
    DHT11Sensor = Adafruit_DHT.DHT11
    DHTpin = 26
    temp, humi = Adafruit_DHT.read_retry(DHT11Sensor, DHTpin)
    if humi is not None and temp is not None:
        humi = round(humi, 1)+0.5*rng.normal()
        temp = round(temp, 1)+0.5*rng.normal()
    return Data(round(humi, 1), round(temp, 1))


def loop_email(delay: float) -> None:
    db = History()
    while True:
        data = db.retrive_recent(1)[-1]
        temp_stat = "正常" if data["temp"] < config.temp_threshold else "过高"
        humi_stat = "正常" if data["humi"] < config.humi_threshold else "过高"
        text = f'temp: {data["temp"]}\nhumi: {data["humi"]}\n温度{temp_stat}, 湿度{humi_stat}'
        send_qqemail(config.subscribe_list, text)
        time.sleep(delay)


def read_data_loop(delay: float) -> None:
    db = History()
    while True:

        # 使用传感器测量irl数据
        data = get_DHT_data()

        # 生成dummy data测试用
        # data = gen_dummy_data()

        alert(data)
        db.insert_data(data)
        time.sleep(delay)
