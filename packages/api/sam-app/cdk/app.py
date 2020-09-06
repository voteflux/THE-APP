#!/usr/bin/env python3

import yaml

from aws_cdk import core
from aws_cdk.core import Construct, CfnParameter, Duration, Fn, ArnComponents, Arn, CfnInclude

from cdk.cdk_stack import CdkStack
from aws_cdk import (
    aws_events as events,
    aws_ssm as ssm,
    aws_apigateway as apig,
    aws_iam as iam,
    aws_cloudformation as cfn,
)
from aws_cdk.aws_iam import Effect as Eff
import aws_cdk.aws_sam as sam
import aws_cdk.aws_dynamodb as ddb
import aws_cdk.aws_backup as backup


def mk_pri_key(pk_name: str):
    return {"name": pk_name, "type": "String"}


def func_ev_api(path, method):
    return sam.CfnFunction.EventSourceProperty(type="Api", properties=sam.CfnFunction.ApiEventProperty(path=path, method=method))


class DdbTables(Construct):
    def __init__(self, scope: Construct, p_name_prefix: CfnParameter, id: str, table_configs, backup_vault, **kwargs):
        super().__init__(scope, id, **kwargs)

        self.backup_plan = _b = backup.BackupPlan.daily_weekly_monthly5_year_retention(self, "backup")
        self.backup_plan.add_rule(backup.BackupPlanRule.daily(backup_vault=backup_vault))

        self.stables = []
        self.tables = []

        for (_t_name, _p_key) in table_configs:
            t_name = '-'.join([p_name_prefix.value_as_string, _t_name])
            sim_table = sam.CfnSimpleTable(self, f'{_t_name}-sim_table', primary_key=_p_key,
                sse_specification=sam.CfnSimpleTable.SSESpecificationProperty(sse_enabled=True),
                table_name=t_name, provisioned_throughput=None)
            self.stables.append(sim_table)
            
            table = ddb.Table.from_table_name(self, f'{_t_name}-table', sim_table.table_name)
            self.tables.append(table)

        self.backup_plan.add_selection("selection", resources=list([
            backup.BackupResource.from_dynamo_db_table(table) for table in self.tables
        ]))



class OauthStack(CdkStack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        core.CfnParameter
        p_name_prefix = CfnParameter(self, "pNamePrefix")
        # p_apig_domain = CfnParameter(self, "pApigDomain")
        # p_rest_api = CfnParameter(self, "pRestApi")
        # p_api_stage = CfnParameter(self, "pApiStage")
        # p_stage = CfnParameter(self, "pStage")
        # p_feedback_email = CfnParameter(self, "pFeedbackEmail")
        # p_site_name_short = CfnParameter(self, "pSiteNameShort")
        # p_base_layer = CfnParameter(self, "pBaseLayer")

        with open("../legacy-template-safe.yaml", "r") as f:
            CfnInclude(self, 'ExistingStack', template=yaml.load(f))

        b_vault = backup.BackupVault(self, "ddb-backup-vault")
        tables = DdbTables(self, p_name_prefix, 'oauth-ddbs', [
            ("oauth-client-apps-ddb", mk_pri_key("client_id")),
            ("oauth-grants-ddb", mk_pri_key("id")),
            ("oauth-users-ddb", mk_pri_key("id")),
            ("oauth-bearer-tokens-ddb", mk_pri_key("id"))
        ], b_vault)

        func_role = iam.CfnRole(self, "f-role", 
            assume_role_policy_document=iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        effect=Eff.ALLOW,
                        principals=[iam.ServicePrincipal("lambda.amazonaws.com")],
                        actions=["sts:AssumeRole"]
                    )
                ]),
            role_name=f"{p_name_prefix.value_as_string}-oauth-lambda-role",
            managed_policy_arns=["arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"])

        func_policy = iam.CfnPolicy(self, "f-policy",
            policy_document=iam.PolicyDocument(
                statements=list([s for s in [
                    iam.PolicyStatement(
                        effect=Eff.ALLOW,
                        actions=["ssm:GetParameter", "ssm:DecryptParameter"],
                        resources=[
                            Arn.format(ArnComponents(
                                service="ssm", resource="parameter", 
                                resource_name=f"{p_name_prefix.value_as_string}-mongodb-uri"
                            ), self)
                        ],
                    ),
                    iam.PolicyStatement(
                        effect=Eff.ALLOW, actions=["dynamodb:*"], resources=[
                            Arn.format(ArnComponents(
                                service="dynamodb", resource="table",
                                resource_name=f"{p_name_prefix.value_as_string}-oauth-*"
                            ), self)
                        ]
                    )
                ]])
            ),
            roles=[func_role.attr_arn],
            policy_name=f"{p_name_prefix.value_as_string}-oauth-lambda-policy")

        # fp = iam.PolicyStatement.

        func = sam.CfnFunction(self, "oauth-func",
            code_uri="./funcs/oauth",
            handler="handlers.main",
            runtime="python3.6",
            layers=[Fn.ref("rBaseLayer")],
            environment=dict(variables=dict(
                pNamePrefix=p_name_prefix.value_as_string
            )),
            events=dict(
                OauthAuthzGet=func_ev_api("/oauth/authorize", "get"),
                OauthAuthzPost=func_ev_api("/oauth/authorize", "post"),
            ),
            role=func_role.ref
        )
        


app = core.App()
OauthStack(app, "cdk")

sam.CfnSimpleTable

app.synth()
