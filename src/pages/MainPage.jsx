import React from 'react';
import Header from '../components/Header';
import Overview from '../components/Overview';
import Summary from '../components/Summary';

const MainPage = () => {
    return (
        <div className="container main">
            <Header/>
            <Overview/>
            <Summary/>
        </div>
    )
}

export default MainPage;