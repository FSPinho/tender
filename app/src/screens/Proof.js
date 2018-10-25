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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Palette from "../theme/Palette";

const Banner = FireBase.admob.Banner

class Proof extends React.Component {

    constructor(props) {
        super(props)

        this.state = {
            questionsPrepared: false,
            questionsCount: 0,
            questionsIndex: -1,
            questionsVisible: false,
            questionsAnswers: {},
            questionsEnded: false,
            points: 0.0,
            grade: 0.0
        }
    }

    asyncSetState = async state =>
        new Promise(a => this.setState({...this.state, ...state}, a))

    doPrepareQuestions = async (questionsCount) => {
        await this.props.data.doUpdateQuestions(this.subject.key, this.topic.key, questionsCount)
        const questions = this.props.data.questions
        await this.asyncSetState({
            questionsPrepared: true,
            questionsCount: questions.length
        })
        await this.doForwardQuestion()
    }

    doAnswerQuestion = async (q, accepted) => {
        await this.asyncSetState({
            questionsAnswers: {
                [q.key]: accepted,
            },
            points: this.state.points + (accepted ? 1 : 0),
        })
    }

    doForwardQuestion = async () => {
        const {questionsIndex} = this.state
        await this.asyncSetState({questionsVisible: false})
        setTimeout(async () => {
            await this.asyncSetState({questionsIndex: questionsIndex + 1})
            if (this.state.questionsIndex >= this.state.questionsCount)
                await this.asyncSetState({
                    questionsEnded: true,
                    grade: this.state.points / this.state.questionsCount * 10
                })
            else
                await this.asyncSetState({questionsVisible: true})
        }, 400)
    }

    doFinish = () => {
        this.props.navigation.goBack()
    }

    get topic() {
        return this.props.navigation.getParam('topic')
    }

    get subject() {
        return this.props.navigation.getParam('subject')
    }

    render() {
        const {data} = this.props
        const {questionsPrepared, questionsIndex, questionsVisible, questionsEnded, grade} = this.state

        const questions = data.questions
        const question = questions[questionsIndex] || {}

        return (
            <Box fit primary column centralize>
                <Box fit secondary>
                    <Loading active={data.questionsLoading}
                             size={56} centralize fit>
                        <FadeFromDown visible={!questionsPrepared}
                                      style={StyleSheet.absoluteFillObject}>
                            <Box fit centralize padding>
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
                            </Box>
                        </FadeFromDown>

                        <FadeFromDown visible={questionsPrepared && questionsVisible}
                                      style={StyleSheet.absoluteFillObject}>
                            <QuestionItem
                                text={question.p || []}
                                answers={(question.a || []).map(q => ({text: q.t, correct: !!q.c}))}
                                onAnswered={accepted => this.doAnswerQuestion(question, accepted)}
                                onNextQuestionRequired={this.doForwardQuestion}/>
                        </FadeFromDown>

                        <FadeFromDown visible={questionsEnded}
                                      style={StyleSheet.absoluteFillObject}>
                            <Box fit centralize padding>
                                <Box padding paper centralize column primary>
                                    <Icon
                                        name={grade > 6 ? 'emoticon' : 'emoticon-dead'}
                                        size={56}
                                        color={grade > 6 ? Palette.Green : Palette.Red}/>
                                    <Spacer vertical/>
                                    <Box centralize>
                                        <Text>
                                            Sua nota:
                                        </Text>
                                        <Spacer small/>
                                        <Text children={grade.toFixed(2)} size={20}
                                              weight={'900'}
                                              color={grade > 6 ? Palette.Green : Palette.Red}/>
                                    </Box>
                                    <Spacer vertical/>
                                    <Text>
                                        {grade > 6 ? 'Parabéns!!!' : 'Mais sorte na próxima!'}
                                    </Text>
                                    <Spacer vertical/>
                                    <Box centralize>
                                        <Button onPress={this.doFinish} primary>FINALIZAR</Button>
                                    </Box>
                                </Box>
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
