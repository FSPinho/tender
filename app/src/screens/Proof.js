import React from 'react'
import {StyleSheet, TouchableWithoutFeedback} from 'react-native'
import {withTheme} from "../theme";
import withData from "../api/withData";
import Loading from "../components/Loading";
import Box from "../components/Box";
import QuestionItem from "../components/QuestionItem";
import FadeFromDown from "../components/FadeFronDown";
import Text from "../components/Text";
import Spacer from "../components/Spacer";
import Button from "../components/Button";
import FireBase from 'react-native-firebase'

const Banner = FireBase.admob.Banner

class Proof extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            questionsPrepared: false,
            questionsCount: 0,
            questionsAnswers: {}
        }
    }

    doPrepareQuestions = async (questionsCount) => {
        await this.props.data.doUpdateQuestions(this.subject.key, this.topic.key, questionsCount)
        const questions = this.props.data.questions
        this.setState({
            questionsPrepared: true,
            questionsCount: questions.length
        })
    }

    get topic() {
        return this.props.navigation.getParam('topic')
    }

    get subject() {
        return this.props.navigation.getParam('subject')
    }

    render() {
        const {data} = this.props
        const {questionsPrepared} = this.state

        return (
            <Box fit primary column centralize>

                <Box fit secondary centralize>
                    <Loading active={data.questionsLoading} size={56} centralize fit>
                        <FadeFromDown visible={!questionsPrepared}>
                            <Box padding paper centralize column primary>
                                <Text primary>{this.subject.t}</Text>
                                <Text secondary>{this.topic.t}</Text>

                                <Spacer vertical large/>

                                <Button onPress={() => this.doPrepareQuestions(1)}
                                        flat primary>
                                    SIMULADO RÁPIDO: 1 QUESTÂO
                                </Button>
                                <Spacer vertical small/>
                                <Button onPress={() => this.doPrepareQuestions(2)}
                                        flat primary>
                                    SIMULADO NORMAL: 2 QUESTÕES
                                </Button>
                                <Spacer vertical small/>
                                <Button onPress={() => this.doPrepareQuestions(3)}
                                        flat primary>
                                    SIMULADO LONGO: 3 QUESTÕES
                                </Button>
                            </Box>
                        </FadeFromDown>
                    </Loading>
                </Box>

                <Box centralize paper padding>
                    <TouchableWithoutFeedback
                        onPress={() => console.log("Proof:render - banner pressed")}>
                        <Box primary paper centralize>
                            <Banner size={'BANNER'}
                                    onAdLoaded={e => console.log("Ad loaded:", e)}
                                    onAdFailedToLoad={e => console.log("Can't load banner:", e)}
                                    unitId={__DEV__ ? 'ca-app-pub-3940256099942544/6300978111' : 'ca-app-pub-5594222713152935/5215014180'}/>

                        </Box>
                    </TouchableWithoutFeedback>
                </Box>
            </Box>
        )
    }
}

const styles = StyleSheet.create({})

export default withData(withTheme(styles, Proof))
