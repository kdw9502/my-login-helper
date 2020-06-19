import decimal

import boto3
import json
from botocore.exceptions import ClientError

from tld import get_tld, get_fld

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

    try:
        item = response['Item']
    except:
        raise Exception("There is no login information for that url.")
    pass_types = item['pass_types']



    all_count = 0
    for pass_type in pass_types:
        all_count = all_count + pass_type['count']

    top_3_types = sorted(pass_types, key=lambda x: x['count'], reverse=True)[:3]

    for type in top_3_types:
        type["percent"] = type["count"] / all_count * 100

    length_list = item["length_list"]

    _sum = sum(length_list)
    iter_sum = 0
    min_len = 0
    for i,value in enumerate(length_list):
        iter_sum += value
        if iter_sum > _sum * decimal.Decimal(0.1):
            min_len = i
            break

    result = {"url": url, "pass_types": top_3_types, "min_len": min_len}

    return result


def create_login_info(infos):
    infos["count"] = 1
    url = infos.pop("url")

    length = int(infos.pop("length",infos.pop("len",0)))

    new_info = {"url": url, "pass_types": [infos]}

    new_info["length_list"] = [0 for _ in range(31)]
    new_info["length_list"][length] = 1

    table.put_item(Item=new_info)

    return new_info


def add_login_info(infos):
    url = infos.pop('url')
    length = int(infos.pop('len',infos.pop('length',0)))
    if length > 30:
        length = 30

    try:
        response = table.get_item(Key={'url': url})
        item = response['Item']
    except (ClientError, KeyError) as e:
        # 기존 키 부재
        try:
            infos['url'] = url
            infos['length'] = length
            response = create_login_info(infos)
        except ClientError as e:
            print("fail to update or create :", e)
            return None
        else:
            print("Insert Item succeeded:", response)
            return response

    for key, value in infos.items():
        if type(value) is int or type(value) is float:
            infos[key] = decimal.Decimal(value)

    # 기존 키 존재
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

    if length != 0:
        item["length_list"][length] += 1

    item.pop("url", None)
    update_expression = "set " + ", ".join([f"{key} = :{key}" for key in item.keys()])

    response = table.update_item(
        Key={'url': url},
        UpdateExpression=update_expression,
        ExpressionAttributeValues={":" + key: value for key, value in item.items()},
        ReturnValues="UPDATED_NEW"
    )

    print("Update Item succeeded:", response)
    return item


def respond(err, res=None):
    return {
        'statusCode': '400' if err else '200',
        'body': f"{type(err).__name__} {str(err)}" if err else json.dumps(res, cls=DecimalEncoder),
        'headers': {
            'Content-Type': 'application/json',
        },
    }


def lambda_handler(event, context):
    # print("Received event: " + json.dumps(event, indent=2))

    operation = event['httpMethod']

    if operation == "GET":
        info = event['queryStringParameters']
        info['url'] = info['url'].replace("www.", "")
        tld = get_tld(info['url'], as_object=True, fix_protocol=True)
        try:
            result = dict()
            result["main"] = get_login_info(f"{tld.subdomain}.{tld.domain}.{tld.tld}")
            if tld.subdomain:
                result["sub"] = get_login_info(f"*.{tld.domain}.{tld.tld}")

            return respond(None, result)
        except Exception as e:
            return respond(e)
    elif operation == "POST":
        info = json.loads(event['body'])
        info['url'] = info['url'].replace("www.", "")
        tld = get_tld(info['url'], as_object=True, fix_protocol=True)
        try:
            result = dict()
            info['url'] = f"{tld.subdomain}.{tld.domain}.{tld.tld}"
            result["main"] = add_login_info(info.copy())
            if tld.subdomain:
                info['url'] = f"*.{tld.domain}.{tld.tld}"
                result["sub"] = add_login_info(info)

            return respond(None, result)
        except Exception as e:
            return respond(e)
