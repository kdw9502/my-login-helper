import decimal

import boto3
import json
from botocore.exceptions import ClientError

# from tld import get_tld, get_fld

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table("my_login_helper")


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            if abs(o) % 1 > 0:
                return float(o)
            else:
                return int(o)
        return super(DecimalEncoder, self).default(o)


def get_login_info(url):
    # db 조회후 정보 리턴
    try:
        response = table.get_item(Key={'url': url})
    except ClientError as e:
        print(e.response['Error']['Message'])
        return None

    item = response['Item']
    pass_types = item['pass_types']

    all_count = 0
    for pass_type in pass_types:
        all_count = all_count + pass_type['count']

    top_3_types = sorted(pass_types, key=lambda x: x['count'], reverse=True)[:3]

    for type in top_3_types:
        type["percent"] = type["count"] / all_count * 100 // 0.01 * 0.01

    result = {"url": url, "pass_types": top_3_types}
    return result


def create_login_info(infos):
    infos["count"] = 1
    url = infos.pop("url")
    new_info = {"url": url, "pass_types": [infos]}

    return table.put_item(Item=new_info)


def add_login_info(url, infos):
    url = infos.pop('url')
    try:
        response = table.get_item(Key={'url': url})
    except ClientError as e:
        # 기존 키 부재
        try:
            response = create_login_info(infos)
        except ClientError as e:
            print("fail to update or create :", e)
            return None
        else:
            print("Insert Item succeeded:", response)
            return response

    for key,value in infos.items():
        if type(value) is int or type(value) is float:
            infos[key] = decimal.Decimal(value)

    # 기존 키 존재
    item = response['Item']
    pass_types = item["pass_types"]
    is_new = True
    for i in range(len(pass_types)):
        count = pass_types[i].pop('count')
        if pass_types[i] == infos:
            item["pass_types"][i]['count'] = count + 1
            is_new = False
            break

    if is_new:
        infos["count"] = 1
        item["pass_types"].append(infos)

    item.pop("url",None)
    update_expression = "set " + ", ".join([f"{key} = :{key}" for key in item.keys()])

    response = table.update_item(
        Key={'url': url},
        UpdateExpression=update_expression,
        ExpressionAttributeValues={":"+key:value for key,value in item.items()},
        ReturnValues="UPDATED_NEW"
    )

    print("Update Item succeeded:", response)
    return response


def respond(err, res=None):
    return {
        'statusCode': '400' if err else '200',
        'body': str(err) if err else json.dumps(res, cls=DecimalEncoder),
        'headers': {
            'Content-Type': 'application/json',
        },
    }


def lambda_handler(event, context):
    # print("Received event: " + json.dumps(event, indent=2))

    operation = event['httpMethod']

    if operation == "GET":
        info = event['queryStringParameters']
        try:
            return respond(None, get_login_info(info['url']))
        except Exception as e:
            return respond(e)
    elif operation == "POST":
        info = json.loads(event['body'])
        try:
            return respond(None, add_login_info(info['url'],info))
        except Exception as e:
            return respond(e)
