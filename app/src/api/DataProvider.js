import React, {Component} from 'react'
import FireBase from 'react-native-firebase'
import {Alert} from '../services'
import NameUtils from "../services/NameUtils";

const {Provider, Consumer} = React.createContext({
    data: undefined
});

export {Consumer}

class DataProvider extends Component {
    constructor(props) {
        super(props)

        this.state = {

            user: {
                key: undefined,
                name: undefined,
                firstName: undefined,
                lastName: undefined,
                email: undefined,
                photo: undefined,

                /** User data */
                history: {
                    lastQuestionIndex: 0,
                    grade: 0.0,
                    proofsCount: 0,
                },
            },
            userLoading: false,
            loveds: {},
            lovedsLoading: false,
            proofs: [],
            proofsLoading: false,
            proofsQuestions: [],
            proofsQuestionsLoading: false,
            proofsSubjects: {},
            proofsSubjectsLoading: false,

            /** True if loaded at least once */
            dirty: false,

            /** Questions data */
            subjects: [],
            subjectsTimestamp: 0,
            subjectsLoading: false,
            questions: [],
            questionsTimestamp: 0,
            questionsLoading: false,
            bancas: [],
            bancasTimestamp: 0,
            bancasLoading: false,

            doUpdate: this.doUpdate,
            doUpdateQuestions: this.doUpdateQuestions,
            doUpdateUser: this.doUpdateUser,
            doUpdateUserHistoryMeta: this.doUpdateUserHistoryMeta,
            doSaveProof: this.doSaveProof,
            doUpdateLoveds: this.doUpdateLoveds
        }
    }

    async componentDidMount() {
        await this.doUpdate()
    }

    asyncSetState = async state =>
        await new Promise(a => requestAnimationFrame(() => this.setState({...this.state, ...state}, a)))

    doOrAlert = async (toDos, errorMessage) => {
        try {
            for (let toDo of toDos) {
                await toDo()
            }
            ;
        } catch (e) {
            !!errorMessage && Alert.showLongText(errorMessage)
            console.warn('DataProvider:doOrAlert - Can\'t do tasks:', e)
        }
    }

    doMapToList = async map => {
        const list = []
        map.docs.map(d => list.push({...d.data(), key: d.id}))
        return list
    }

    doRemoveDuplicates = list => {
        const map = {}
        list.map(i => {
            map[i.key] = i
        })
        return Object.keys(map).map(k => map[k])
    }

    doUpdate = async () => {
        await this.asyncSetState({
            subjectsLoading: true,
            bancasLoading: true,
            historyLoading: true
        })

        await this.doOrAlert([async () => {
            console.log('DataProvider:doUpdate - Loading subject...')
            const subjects = await this.doMapToList(
                await FireBase.firestore()
                    .collection('subjects-topics')
                    .where('c', '>', 0)
                    .orderBy('c')
                    .get()
            )

            console.log(subjects)

            subjects.map(s => {
                s.o = Object.keys(s.o).map(key => ({...s.o[key], key}))
                s.o.sort((a, b) => a.t.localeCompare(b.t))
                s.o = s.o.filter(t => t.c > 10)
            })
            subjects.sort((a, b) => a.t.localeCompare(b.t))

            console.log('DataProvider:doUpdate - Loading bancas...')
            const bancas = []

            console.log('DataProvider:doUpdate - Loading history...')
            const history = []

            console.log('DataProvider:doUpdate - Data downloaded!')

            await this.asyncSetState({
                subjects,
                subjectsTimestamp: +new Date(),
                bancas,
                bancasTimestamp: +new Date(),
                history,
                historyTimestamp: +new Date(),
            })
        }], 'Oops, você está sem internet?')

        await this.asyncSetState({
            subjectsLoading: false,
            bancasLoading: false,
            historyLoading: false,
            dirty: true,
        })
    }

    doUpdateQuestions = async (s, t, l = 3) => {

        console.log(s, t, l)

        await this.asyncSetState({questionsLoading: true})

        await this.doOrAlert([
            async () => {
                const baseQuery = await FireBase.firestore()
                    .collection('questions')
                    .where('s', '==', s)
                    .where('t', '==', t)

                const {history} = this.state.user

                let questions = await this.doMapToList(
                    await baseQuery.orderBy('x').startAfter(history.lastQuestionIndex).limit(l).get()
                )

                if (questions.length < l) {
                    const offset = l - questions.length
                    console.log("DataProvider:doUpdateQuestions - Retrieved questions are not enough, getting more...", offset)
                    const questionsOffset = await this.doMapToList((await baseQuery.orderBy('x').limit(offset).get()))
                    await this.doUpdateUserHistory({
                        lastQuestionIndex: (questionsOffset[questionsOffset.length - 1] || questions[questions.length - 1] || []).x || history.lastQuestionIndex
                    })
                    questions = this.doRemoveDuplicates([...questions, ...questionsOffset])
                } else {
                    await this.doUpdateUserHistory({
                        lastQuestionIndex: questions[questions.length - 1].x
                    })
                }

                await this.asyncSetState({questions})
            }
        ], 'Não foi possível baixar as questões!')

        await this.asyncSetState({questionsLoading: false})
    }

    doUpdateUser = async ({user}) => {
        this.asyncSetState({userLoading: true})

        await this.doOrAlert([
            async () => {
                const _user = {
                    key: user.uid,
                    name: NameUtils.getName(user),
                    firstName: NameUtils.getFirstName(user),
                    lastName: NameUtils.getLastName(user),
                    email: user.email,
                    photo: user.photoURL,

                    /** User data */
                    history: {
                        lastQuestionIndex: 0,
                        grade: 0.0,
                        proofsCount: 0,
                    }
                }

                const userRef = FireBase.firestore().collection('users').doc(user.uid)
                const snapshot = await userRef.get()

                if (!snapshot.exists) {
                    await userRef.set({
                        ..._user,
                        creationTimestamp: +new Date(),
                        creationTimestampReverse: -+new Date(),
                        lastAccessTimestamp: +new Date(),
                        lastAccessTimestampReverse: -+new Date(),
                    })
                } else {
                    await userRef.update({
                        ..._user,
                        history: {
                            ...user.history,
                            ...snapshot.data().history,
                        },
                        lastAccessTimestamp: +new Date(),
                        lastAccessTimestampReverse: -+new Date(),
                    })
                }

                const __user = await userRef.get()
                await this.asyncSetState({user: __user.data()})
            }
        ], 'Oops, verifique sua conexão!')

        await this.doUpdateLoveds()
        await this.doUpdateProofsSubjects()

        await this.asyncSetState({userLoading: false})
    }

    doUpdateLoveds = async (loveds = {}) => {
        await this.asyncSetState({lovedsLoading: true})

        await this.doOrAlert([
            async () => {
                const lovedsRef = FireBase.firestore()
                    .collection('users')
                    .doc(this.state.user.key)
                    .collection('loveds')

                for (let k of Object.keys(loveds)) {
                    console.log("DataProvider:doUpdateLoveds - Updating:", k, loveds[k])
                    await lovedsRef.doc(k).set({loved: loveds[k]})
                }

                const lovedsMap = {}
                const lovedsSnapshot = await lovedsRef.get()
                lovedsSnapshot.forEach(snapshot => {
                    lovedsMap[snapshot.id] = !!snapshot.data() && snapshot.data().loved
                })

                this.asyncSetState({
                    loveds: lovedsMap
                })
            }
        ], Object.keys(loveds).length ? 'Não foi possível favoritar este item. Verifique sua conexão!' : undefined)

        await this.asyncSetState({lovedsLoading: false})
    }

    doUpdateProofsSubjects = async (proofsSubjects = {}) => {
        await this.asyncSetState({proofsSubjectsLoading: true})

        console.log('DataProvider:doUpdateProofsSubjects - Updating proofs...')

        await this.doOrAlert([
            async () => {
                const proofsSubjectsRef = FireBase.firestore()
                    .collection('users')
                    .doc(this.state.user.key)
                    .collection('subjects')

                for (let k of Object.keys(proofsSubjects)) {
                    console.log("DataProvider:doUpdateProofsSubjects - Updating:", k, proofsSubjects[k])
                    await proofsSubjectsRef.doc(k).set({...proofsSubjects[k], proofsTopics: undefined})

                    for (let tk of Object.keys(proofsSubjects[k].proofsTopics)) {
                        console.log("DataProvider:doUpdateProofsSubjects - Updating topic:", tk, proofsSubjects[k].proofsTopics[tk])
                        await proofsSubjectsRef.doc(k).collection('topics').doc(tk).set({...proofsSubjects[k].proofsTopics[tk]})
                    }
                }

                const proofsSubjectsMap = {}
                const proofsSubjectsSnapshot = await proofsSubjectsRef.get()
                proofsSubjectsSnapshot.forEach(snapshot => {
                    proofsSubjectsMap[snapshot.id] = snapshot.data()
                    proofsSubjectsMap[snapshot.id].proofsTopics = {}
                })

                for (let k of Object.keys(proofsSubjectsMap)) {
                    if(proofsSubjectsMap[k].proofsCount) {
                        console.log('DataProvider:doUpdateProofsSubjects - Updating subject topics proofs...')

                        const proofsTopicsSnapshot = await proofsSubjectsRef.doc(k).collection('topics').get()
                        proofsTopicsSnapshot.forEach(snapshot => {
                            proofsSubjectsMap[k].proofsTopics[snapshot.id] = snapshot.data()
                        })
                    } else {
                        console.log('DataProvider:doUpdateProofsSubjects - Skipping subject topics proofs, there are no proofs!')
                    }
                }

                await this.asyncSetState({
                    proofsSubjects: proofsSubjectsMap
                })
            }
        ])

        await this.asyncSetState({proofsSubjectsLoading: false})
    }

    doUpdateUserHistory = async (history = {}) => {
        if (!this.state.user)
            return

        console.log("DataProvider:doUpdateUserHistory - Updating history", this.state.user.history, history)

        await this.asyncSetState({userLoading: true})

        await this.doOrAlert([
            async () => {
                const userRef = FireBase.firestore()
                    .collection('users')
                    .doc(this.state.user.key)

                await userRef.update({
                    history: {
                        ...this.state.user.history,
                        ...history,
                    }
                })
                await this.asyncSetState({
                    user: (await userRef.get()).data()
                })
            }
        ], 'Oops. Algo de errado aconteceu!')

        await this.asyncSetState({userLoading: false})
    }

    doSaveProof = async ({proof, questions}) => {
        if (!this.state.user) {
            return
        }

        if (isNaN(proof.g)) {
            console.log("DataProvider:doSaveProof - Can't save proof, invalid grade!")
            return
        }

        await this.asyncSetState({proofsLoading: true, proofsQuestionsLoading: true})

        await this.doOrAlert([

            async () => {

                const proofsRef = FireBase.firestore()
                    .collection('users')
                    .doc(this.state.user.key)
                    .collection('proofs')

                await proofsRef.add(proof)

                const questionsRef = FireBase.firestore()
                    .collection('users')
                    .doc(this.state.user.key)
                    .collection('questions')

                for (let k of Object.keys(questions)) {
                    await questionsRef.doc(k).set(questions[k])
                }

                await this.doUpdateUserHistory({
                    grade: this.state.user.history.grade + proof.g,
                    proofsCount: this.state.user.history.proofsCount + 1,
                })

                const existingProofSubject = this.state.proofsSubjects[proof.s] || {grade: 0, proofsCount: 0}
                let existingProofTopic = {grade: 0, proofsCount: 0}

                if(this.state.proofsSubjects[proof.s])
                    if(this.state.proofsSubjects[proof.s].proofsTopics[proof.t])
                        existingProofTopic = this.state.proofsSubjects[proof.s].proofsTopics[proof.t]


                await this.doUpdateProofsSubjects({
                    [proof.s]: {
                        grade: existingProofSubject.grade + proof.g,
                        proofsCount: existingProofSubject.proofsCount + 1,
                        proofsTopics: {
                            [proof.t]: {
                                grade: existingProofTopic.grade + proof.g,
                                proofsCount: existingProofTopic.proofsCount + 1,
                            }
                        }
                    }
                })

            }
        ], 'Não foi possível salvar seu resultado. Verifique sua conexão!')

        await this.asyncSetState({proofsLoading: false, proofsQuestionsLoading: false})
    }

    render() {
        return (
            <Provider
                value={{
                    data: this.state
                }}>
                {this.props.children}
            </Provider>
        )
    }
}


export default DataProvider
