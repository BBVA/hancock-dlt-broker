def install_dependencies() {
  stage('Install Dependencies'){
    container('node'){
      sh """
        yarn cache clean --force
        yarn install
      """
    }
  }
}

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
    
    unit_tests()

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

    unit_tests()

    docs()

    // check_unlocked_in_RC_shuttle_stage()

    docker_shuttle_stage()

    // qa_data_shuttle_stage()

    // logic_label_shuttle_stage()

    deploy_shuttle_stage(project: "hancock", environment: "qa", askForConfirmation: false)

    // set2rc_shuttle_stage()

    stage ('Functional Tests') {
      build job: '/hancock/kst-hancock-ms-dlt-broker-tests/master'
    }

  }
}
