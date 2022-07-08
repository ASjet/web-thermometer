# 基于Web的温湿度仪表盘

## 功能特性

- 实时温度显示
- 历史温度显示(最近N条/自定义时间区间)
- 邮件订阅/报警
- 数据库存取历史数据

## 参数配置

`app.py:main()`

- `send_email`中的参数为邮件发送线程的发送时间周期
- `run_sensor`中的参数为数据采集线程的采样周期
- `app.run`中的`host`参数为本地服务器的地址，`port`为端口号，其余无需修改

`config.py`

- `temp_threshold`为温度报警阈值初始值
- `humi_threshold`为湿度报警阈值初始值
- `email_account`为邮件发送账号
- `email_passwd`为邮件发送密码(如使用QQ邮箱则需申请第三方客户端授权码)
- `server_list`为邮件服务器配置列表，默认只有QQ邮箱，可添加其他邮箱服务

`action.py`

可自行修改GPIO端口和邮件信息格式化字符串

`sensor.py`

修改`read_data_loop`中主循环注释内容来选择数据来源

`static/js/main.js`

修改`mainLoop`中的`sleep`参数可以调整仪表盘刷新频率

## 使用方法

### web界面

- `python3 app.py`运行flask web服务
- 点击面板上的`实时`按钮可以切换到显示实时数据模式
- 在时间框内输入格式为`YYYY-MM-DD HH:mm:ss`的时间区间并点击`历史区间`可以切换到区间模式
- 在邮件框内输入邮件并点击`订阅`/`退订`按钮分别进行订阅和退订。订阅和退订操作均会发送邮件
- 滑动仪表盘下方的滑条可以控制温度和湿度的报警阈值，两侧会分别显示具体阈值数值

### 数据库

```shell
# 创建sqlite3数据库History.db，只需运行一次
python3 db.py -c
# 清空数据库
python3 db.py -r
# 导出数据库内容到CSV格式
python3 db.py -d <filename>
```
