import argparse
import collections
import sqlite3
from datetime import datetime, timezone

parser = argparse.ArgumentParser(description="Database manager",
                                 prog="python3 db.py")
parser.add_argument("-c", "--create", help="Create history database",
                    action="store_true")
parser.add_argument("-r", "--remove", help="Remove all history records",
                    action="store_true")
parser.add_argument("-d", "--dump", help="Dump all history records",
                    metavar="file_name")


DB_NAME = "history.db"
TABLE_NAME = "history"

Data = collections.namedtuple("Data", ["temp", "humi"])


def cur_utc_timestamp() -> int:
    """获取当前UTC时间戳"""
    dt = datetime.now(timezone.utc)
    utc_time = dt.replace(tzinfo=timezone.utc)
    return int(utc_time.timestamp())


class History:
    def __init__(self) -> None:
        try:
            self.db = sqlite3.connect(DB_NAME)
            self.cur = self.db.cursor()
        except:
            self.create_table()
            self.db = sqlite3.connect(DB_NAME)
            self.cur = self.db.cursor()

    def __del__(self) -> None:
        self.db.commit()
        self.db.close()

    def create_table(self) -> None:
        self.cur.execute(f"""
        CREATE TABLE {TABLE_NAME} (timestamp int, temp real, humi real)
        """)
        self.db.commit()

    def insert_data(self, data: Data) -> bool:
        timestamp = cur_utc_timestamp()
        try:
            self.cur.execute(f"""
            INSERT INTO {TABLE_NAME} VALUES ({timestamp}, {data.temp}, {data.humi})
            """)
            self.db.commit()
            return True
        except:
            return False

    def retrive_recent(self, amount: int = 10) -> list[dict]:
        try:
            items = self.cur.execute(f"""
            SELECT * FROM {TABLE_NAME} ORDER BY timestamp DESC LIMIT {amount}
            """)
            res = []
            for item in items:
                res.append(
                    {"timestamp": item[0], "temp": item[1], "humi": item[2]})
            return res
        except:
            return None

    def retrive_interval(self, time_start, time_stop) -> list[dict]:
        try:
            items = self.cur.execute(f"""
                SELECT * FROM {TABLE_NAME} WHERE timestamp >= {time_start}
                and timestamp <= {time_stop} ORDER BY timestamp DESC
            """)
            res = []
            for item in items:
                res.append(
                    {"timestamp": item[0], "temp": item[1], "humi": item[2]})
            return res
        except:
            return None

    def clear(self) -> bool:
        try:
            self.cur.execute(f"""
            DELETE FROM {TABLE_NAME}
            """)
            self.db.commit()
            return True
        except:
            return False

    def dump(self, filename: str) -> bool:
        try:
            items = self.cur.execute(f"""
            SELECT * FROM {TABLE_NAME} ORDER BY timestamp
            """)
            with open(filename, "w") as f:
                for item in items:
                    f.write(f"{item[0]},{item[1]},{item[2]}\n")
            return True
        except:
            return False


if __name__ == "__main__":
    args = parser.parse_args()
    db = History()
    if args.create:
        db.create_table()
    elif args.remove:
        db.clear()
    elif args.dump:
        db.dump(args.dump)
    else:
        parser.print_help()
