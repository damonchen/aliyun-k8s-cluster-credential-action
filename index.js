const core = require('@actions/core');

const YAML = require('yaml');
const fs = require('fs');
const path = require('path');
const os = require('os');

const generateKubeConfig = (aliK8sCluster) => {
    const userName = aliK8sCluster.clusterName + '-admin';
    const contextName = userName + '-' + aliK8sCluster.clusterId;

    const config = {
        apiVersion: 'v1',
        clusters: [
            {
                cluster: {
                    'certificate-authority-data': aliK8sCluster.clusterCertAuthData,
                    server: aliK8sCluster.server
                },
                name: aliK8sCluster.clusterName
            }
        ],
        contexts: [
            {
                context: {
                    cluster: aliK8sCluster.clusterId,
                    user: userName
                },
                name: contextName
            }
        ],
        'current-context': contextName,
        kind: 'Config',
        preferences: {},
        users: [
            {
                name: userName,
                user: {
                    'client-certificate-data': aliK8sCluster.clusterClientAuthData,
                    'client-key-data': aliK8sCluster.clusterClientKeyData
                }
            }
        ]
    };
    return YAML.stringify(config)
}


const process = async (aliK8sCluster) => {
    const kubeConfig = generateKubeConfig(aliK8sCluster);
    await fs.promises.mkdir(path.join(os.homedir(), '.kube'), {recursive: true, mode: 0o700});
    await fs.promises.writeFile(path.join(os.homedir(), '.kube/config'), kubeConfig, {mode: 0o600});

    console.log(`finish saving Aliyun k8s cluster config to '$HOME/.kube/config'.`);
}


try {
    const aliK8sCluster = {
        clusterId: core.getInput('cluster_id'),
        clusterName: core.getInput('cluster_name'),
        clusterCertAuthData: core.getInput('cluster_cert_auth_data'),
        clusterClientAuthData: core.getInput('cluster_client_auth_data'),
        clusterClientKeyData: core.getInput('cluster_client_key_data'),
        clusterServer: core.getInput('cluster_server'),
    };

    process(aliK8sCluster).catch((reason) => {
        core.setFailed(`fail to get cluster credentials: ${reason}`);
    });
} catch (error) {
    core.setFailed(error.message);
}