nodePipeline{

  // ---- DEVELOP ----
  if (env.BRANCH_NAME == 'develop') {

    docker_shuttle_stage()

    stage('Create coverage and junit xml'){
      container('node'){
        sh """
          npm run coverage
        """
      }
    }

    //qa_data_shuttle_stage()

    deploy_shuttle_stage(project: "blockchainhub", environment: "develop", askForConfirmation: false)

  }

  // ---- RELEASE ----
  if (env.BRANCH_NAME =~ 'release/*') {

    docker_shuttle_stage()

    qa_data_shuttle_stage()

    deploy_shuttle_stage(project: "blockchainhub", environment: "qa", askForConfirmation: false)

  }
}