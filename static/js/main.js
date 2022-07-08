let chartTemp = echarts.init(document.getElementById('dashboard-temp'));
let chartHumi = echarts.init(document.getElementById('dashboard-humi'));
let chartLine = echarts.init(document.getElementById('chart-line'));

let rangeTempThres = document.getElementById("range-threshold-temp");
let rangeHumiThres = document.getElementById("range-threshold-humi");
let labelTempThres = document.getElementById("label-threshold-temp");
let labelHumiThres = document.getElementById("label-threshold-humi");

let btnChartRealtime = document.getElementById("btn-chart-realtime");
let btnChartInterval = document.getElementById("btn-chart-interval");
let inputStart = document.getElementById("input-start");
let inputStop = document.getElementById("input-stop");
let realtimeFlag = true;

let inputEmail = document.getElementById("input-email");
let btnEmailSub = document.getElementById("btn-email-sub");
let btnEmailUnsub = document.getElementById("btn-email-unsub");

let tempLimit = [-10, 40]
let humiLimit = [0, 100]

function httpRequest(method, url, payload, handler) {
    let request = new XMLHttpRequest();
    request.open(method, url, true);
    request.setRequestHeader("Content-type", "application/json");
    request.onreadystatechange = function () {
        //验证请求是否发送成功
        if (request.readyState == 4 && request.status == 200) {
            //获取服务端返回的数据并由handler处理
            let data = JSON.parse(request.responseText);
            if (handler != null) {
                handler(data);
            } else {
                console.log(JSON.stringify(data));
            }
        }
    }
    request.send(JSON.stringify(payload));
}

function queryRecent(amount) {
    httpRequest("POST", "/recent", { "amount": amount }, (data) => {
        freshChart(data);
    });
}

function queryInterval(start, stop) {
    let payload = {
        "start": start,
        "stop": stop
    };
    httpRequest("POST", "/interval", payload, (data) => {
        freshChart(data);
    })
}

function setThreshold() {
    let threshold = {
        "temp": rangeTempThres.value,
        "humi": rangeHumiThres.value
    }
    httpRequest("POST", "/threshold", threshold, null);
}

function getThreshold() {
    httpRequest("GET", "/threshold", null, (data) => {
        rangeTempThres.value = data.temp;
        rangeHumiThres.value = data.humi;
        labelTempThres.textContent = data.temp;
        labelHumiThres.textContent = data.humi;
    });
}

function subscribeEmail(email) {
    let payload = {
        "email": email,
        "subscribe": true
    };
    httpRequest("POST", "/email", payload, (data) => {
        if (data.success) {
            alert("订阅成功");
        } else {
            alert("该邮箱已订阅");
        }
    })
}

function unSubscribeEmail(email) {
    let payload = {
        "email": email,
        "subscribe": false
    };
    httpRequest("POST", "/email", payload, (data) => {
        if (data.success) {
            alert("退订成功");
        } else {
            alert("该邮箱尚未订阅");
        }
    })
}

function genTempOption(data) {
    let optionTemp = {
        tooltip: {
            formatter: '{a} <br/>{b} : {c}°C'
        },
        toolbox: {
            feature: {
                restore: {},
                saveAsImage: {}
            }
        },
        series: [
            {
                name: '温度指示',
                type: 'gauge',
                min: tempLimit[0],
                max: tempLimit[1],
                detail: { formatter: '{value}°C' },
                data: [
                    {
                        value: data,
                        name: '温度'
                    },
                ]
            }
        ]
    };
    return optionTemp;
}

function genHumiOption(data) {
    let optionHumi = {
        tooltip: {
            formatter: '{a} <br/>{b} : {c}%'
        },
        toolbox: {
            feature: {
                restore: {},
                saveAsImage: {}
            }
        },
        series: [
            {
                name: '湿度指示',
                type: 'gauge',
                min: humiLimit[0],
                max: humiLimit[1],
                detail: { formatter: '{value}%' },
                data: [{ value: data, name: '湿度' }]
            }
        ]
    };
    return optionHumi;
}

function genLineOption(temp, humi, time) {
    let optionLine = {
        tooltip: {
            axisPointer: { type: 'cross' }
        },
        xAxis: [{
            type: 'category',
            data: time,
            axisTick: {
                alignWithLabel: true
            },
        }],
        yAxis: [
            {
                type: 'value',
                name: '温度',
                min: tempLimit[0],
                max: tempLimit[1],
                position: 'left',
                axisLabel: {
                    formatter: '{value} °C'
                }
            },
            {
                type: 'value',
                name: '湿度',
                min: humiLimit[0],
                max: humiLimit[1],
                position: 'right',
                axisLabel: {
                    formatter: '{value} %'
                }
            }
        ],
        series: [
            {
                color: [
                    '#dd6b66',
                    '#759aa0',
                    '#e69d87',
                    '#8dc1a9',
                    '#ea7e53',
                    '#eedd78',
                    '#73a373',
                    '#73b9bc',
                    '#7289ab',
                    '#91ca8c',
                    '#f49f42'
                ],
                name: "温度",
                type: 'line',
                yAxisIndex: 0,
                data: temp,
                smooth: true,
            },
            {
                color: [
                    '#37A2DA',
                    '#32C5E9',
                    '#67E0E3',
                    '#9FE6B8',
                    '#FFDB5C',
                    '#ff9f7f',
                    '#fb7293',
                    '#E062AE',
                    '#E690D1',
                    '#e7bcf3',
                    '#9d96f5',
                    '#8378EA',
                    '#96BFFF'
                ],
                name: "湿度",
                type: 'line',
                yAxisIndex: 1,
                data: humi,
                smooth: true,
            }
        ]
    };
    return optionLine;
}

function freshLineChart(temp, humi, time) {
    let option = genLineOption(temp, humi, time);
    chartLine.setOption(option);
}

function freshTempChart(data) {
    let option = genTempOption(data);
    chartTemp.setOption(option);
}

function freshHumiChart(data) {
    let option = genHumiOption(data);
    chartHumi.setOption(option);
}

function freshChart(data) {
    // 打印收到的数据
    // for (let i of data) {
    //     console.log(`[${i.timestamp}] temp: ${i.temp} humi: ${i.humi}`);
    // }
    let temps = [];
    let humis = [];
    let time_seq = [];
    for (let i of data) {
        temps.push(i.temp);
        humis.push(i.humi);
        let ts = new Date(Number(i.timestamp) * 1000);
        time_seq.push(`${ts.getHours()}:${ts.getMinutes()}:${ts.getSeconds()}`);
    }
    freshLineChart(temps.reverse(), humis.reverse(), time_seq.reverse());
    freshTempChart(temps[temps.length - 1]);
    freshHumiChart(humis[humis.length - 1]);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 执行一次
getThreshold();
rangeTempThres.addEventListener("input", () => {
    labelTempThres.textContent = rangeTempThres.value;
});
rangeHumiThres.addEventListener("input", () => {
    labelHumiThres.textContent = rangeHumiThres.value;
});
rangeTempThres.addEventListener("change", setThreshold);
rangeHumiThres.addEventListener("change", setThreshold);

// 主循环
async function mainLoop() {
    while (realtimeFlag) {
        queryRecent(20);
        await sleep(2000);
    }
}
mainLoop();

btnChartRealtime.addEventListener("click", () => {
    realtimeFlag = true;
    mainLoop();
})

function parserTime(timeStr) {
    let res = new Date()
    let parsed = timeStr.match(/(\d+)-(\d+)-(\d+)\s(\d+):(\d+):(\d+)/)
    if (parsed.length === 7) {
        res.setFullYear(Number(parsed[1]));
        res.setMonth(Number(parsed[2]) - 1);
        res.setDate(Number(parsed[3]));
        res.setHours(Number(parsed[4]));
        res.setMinutes(Number(parsed[5]));
        res.setSeconds(Number(parsed[6]))
        return Math.floor(res.getTime() / 1000);
    } else {
        return 0;
    }
}

btnChartInterval.addEventListener("click", () => {
    realtimeFlag = false;
    let start = parserTime(inputStart.value);
    let stop = parserTime(inputStop.value);
    if (start !== 0 && stop !== 0) {
        queryInterval(start, stop);
    } else {
        alert("时间格式错误！");
    }
})

btnEmailSub.addEventListener("click", () => {
    let email = inputEmail.value;
    if (email.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)) {
        subscribeEmail(email);
    } else {
        alert("邮箱格式错误！");
    }
})

btnEmailUnsub.addEventListener("click", () => {
    let email = inputEmail.value;
    if (email.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/)) {
        unSubscribeEmail(email);
    } else {
        alert("邮箱格式错误！");
    }
})