def lint() {
  stage('Linter'){
    container('node'){
      sh """
        yarn run lint
      """
    }
  }
}

def docs() {
  stage('Docs'){
    container('node'){
      sh "yarn run docs"
      upload_doc_shuttle_stage(docName: "docs", docPath: "./documentation")
    }
  }
}

def unit_tests() {
  stage('Unit tests'){
    container('node'){
      sh """
        yarn run coverage
      """
    }
  }
}

nodePipeline{

  // ---- DEVELOP ----
  if (env.BRANCH_NAME == 'develop') {

    try {
      sonar_shuttle_stage()
    } catch (exc) {
      echo 'Sonar shuttle stage crashed!'
      echo 'Continue with the execution'
    }

    install_dependencies()

    lint()

    node_unit_tests_shuttle_stage(sh: """yarn cache clean --force
                                        yarn install
                                        yarn run coverage
                                    """)

    docs()

    docker_shuttle_stage()

    //qa_data_shuttle_stage()

    deploy_shuttle_stage(project: "hancock", environment: "develop", askForConfirmation: false)

  }

  // ---- RELEASE ----
  if (env.BRANCH_NAME =~ 'release/*') {

    try {
      sonar_shuttle_stage()
    } catch (exc) {
      echo 'Sonar shuttle stage crashed!'
      echo 'Continue with the execution'
    }

    install_dependencies()

    lint()

    node_unit_tests_shuttle_stage(sh: """yarn cache clean --force
                                        yarn install
                                        yarn run coverage
                                    """)
    
    docs()

    // check_unlocked_in_RC_shuttle_stage()

    docker_shuttle_stage()
    
    
    deploy_shuttle_stage(project: "hancock", environment: "qa", askForConfirmation: false)

    qa_data_shuttle_stage()

    set2rc_shuttle_stage()
    

    stage ('Functional Tests') {
    try{
      build job: '/blockchainhub/kst-hancock-ms-dlt-broker-tests/master', parameters: [[$class: 'StringParameterValue', name: 'GIT_COMMIT', value: env.GIT_COMMIT], [$class: 'StringParameterValue', name: 'VERSION', value: env.BRANCH_NAME]] , propagate: true
      } catch (e) {
        currentBuild.result = 'UNSTABLE'
        result = "FAIL" // make sure other exceptions are recorded as failure too
    }
    }
    
    create_release_from_RC()
    
    logic_label_shuttle_stage(release: env.BUILD_DISPLAY_NAME)

  }
}
