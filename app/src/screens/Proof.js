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
import {Events} from "../constants/Analytics";

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

    componentDidMount() {
        FireBase.analytics().logEvent(Events.TenderOpenProof, {
            te_subject: this.subject.key,
            te_topic: this.topic.key,
        })
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
        FireBase.analytics().logEvent(Events.TenderProofStart, {
            te_subject: this.subject.key,
            te_topic: this.topic.key,
            te_question_count: questionsCount
        })
    }

    doAnswerQuestion = async (q, accepted) => {
        await this.asyncSetState({
            questionsAnswers: {
                ...this.state.questionsAnswers,
                [q.key]: {
                    t: this.topic.key,
                    s: this.subject.key,
                    d: +new Date(),
                    r: -+new Date(),
                    a: accepted,
                },
            },
            points: this.state.points + (accepted ? 1 : 0),
        })
        FireBase.analytics().logEvent(Events.TenderProofQuestionAnswered, {
            te_subject: this.subject.key,
            te_topic: this.topic.key,
            te_question_key: q.key, accepted
        })
    }

    doForwardQuestion = async () => {
        const {questionsIndex} = this.state
        await this.asyncSetState({questionsVisible: false})
        setTimeout(async () => {
            await this.asyncSetState({questionsIndex: questionsIndex + 1})
            if (this.state.questionsIndex >= this.state.questionsCount) {
                await this.asyncSetState({
                    questionsEnded: true,
                    grade: this.state.points / this.state.questionsCount * 10
                })
                FireBase.analytics().logEvent(Events.TenderProofGetGrade, {
                    te_subject: this.subject.key,
                    te_topic: this.topic.key,
                    te_grade: this.state.grade
                })
            } else {
                await this.asyncSetState({questionsVisible: true})
            }
        }, 800)
    }

    doFinish = async () => {
        await this.props.data.doSaveProof({
            proof: {
                t: this.topic.key,
                s: this.subject.key,
                d: +new Date(),
                r: -+new Date(),
                g: this.state.grade
            },
            questions: this.state.questionsAnswers
        })
        FireBase.analytics().logEvent(Events.TenderProofEnd, {
            te_subject: this.subject.key,
            te_topic: this.topic.key,
        })
        this.props.navigation.goBack()
    }

    get topic() {
        return this.props.navigation.getParam('topic')
    }

    get subject() {
        return this.props.navigation.getParam('subject')
    }

    render() {
        const {data, theme} = this.props
        const {questionsPrepared, questionsIndex, questionsCount, questionsVisible, questionsEnded, grade} = this.state

        const questions = data.questions
        const question = questions[questionsIndex] || {}

        return (
            <Box fit primary column centralize alignStretch>
                {
                    !!questionsPrepared && !questionsEnded && (
                        <Box style={{elevation: 2}}
                             primary
                             padding centralize justifySpaceBetween>
                            <Box style={{height: 16, borderRadius: 8}}
                                 color={theme.palette.backgroundSecondary} fit>
                                <Box
                                    style={{
                                        width: `${(questionsIndex + 1) / questionsCount * 100}%`,
                                        borderRadius: 8
                                    }}
                                    color={theme.palette.primary}/>
                            </Box>
                            <Spacer/>
                            <Box>
                                <Text color={theme.palette.primary} weight={'900'}>
                                    {questionsIndex + 1}/{questionsCount}
                                </Text>
                            </Box>
                        </Box>
                    )
                }

                <Box fit secondary>
                    <Loading active={data.questionsLoading || data.userLoading || data.proofsLoading}
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
                                        <Text children={isNaN(grade) ? '--' : grade.toFixed(2)} size={20}
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

                <Box centralize paddingSmall style={{elevation: 4}} primary>
                    <TouchableWithoutFeedback
                        onPress={() => FireBase.analytics().logEvent(Events.TenderProofBannerClick)}>
                        <Box primary centralize>
                            <Banner size={'BANNER'}
                                    onAdLoaded={() => FireBase.analytics().logEvent(Events.TenderProofBannerLoaded)}
                                    onAdFailedToLoad={() => FireBase.analytics().logEvent(Events.TenderProofBannerError)}
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
