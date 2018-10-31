export const Events = {
    /**
     * Screen navigation
     * */
    TenderOpenHome: 'te_navigate_to_home',
    TenderOpenLogin: 'te_navigate_to_login',
    TenderOpenLoved: 'te_navigate_to_loved',
    TenderOpenProof: 'te_navigate_to_proof',
    TenderOpenTopics: 'te_navigate_to_topics',

    /**
     * Auth and sessions
     * */
    TenderSessionStart: 'te_session_start',
    TenderSessionEnd: 'te_session_end',
    TenderSignIn: 'te_sign_in',
    TenderSignOut: 'te_sign_out',

    /**
     * Content
     * */
    TenderToggleLoved: 'te_toggle_loved',
    TenderThemeEnableLight: 'te_theme_enable_light',
    TenderThemeEnableDark: 'te_theme_enable_dark',
    TenderProofStart: 'te_proof_start',
    TenderProofQuestionAnswered: 'te_proof_question_answered',
    TenderProofGetGrade: 'te_proof_get_grade',
    TenderProofEnd: 'te_proof_end',
    TenderProofBannerLoaded: 'te_proof_banner_loaded',
    TenderProofBannerError: 'te_proof_banner_error',
    TenderProofBannerClick: 'te_proof_banner_click',
}