import React from 'react';
import Header from '../components/Header';
import Summary from '../components/Summary';
import Goals from '../components/Goals';

const MainPage = () => {
    return (
        <div className="container main">
            <Header/>
            <Goals/>
            <Summary/>
        </div>
    )
}

export default MainPage;