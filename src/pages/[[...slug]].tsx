import { GetStaticPaths, GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { parseStringPromise } from 'xml2js'
import { Article, Blog, Platform } from '~/components/Blog'
import { SNS } from '~/components/SNS'
import { Presentation } from '~/components/Presentation'
import { Skill } from '~/components/Skill'
import { OSS } from '~/components/OSS'
import { Career } from '~/components/Career'
import { Profile } from '~/components/Profile'
import { Divider } from '~/components/Divider'
import { Breadcrumb } from '~/components/Breadcrumb'

type Props = {
  articles: Article[]
  page: 'top' | 'blog'
}

async function getAtom(platform: Platform, url: string): Promise<Article[]> {
  const res = await fetch(url)
  const text = await res.text()
  const obj = await parseStringPromise(text)
  if (obj.rss) {
    return obj.rss.channel[0].item.map((e) => ({
      title: e.title[0],
      published: new Date(e.pubDate[0]).toISOString(),
      link: e.link[0],
      platform,
    }))
  } else {
    return obj.feed.entry.map((e) => ({
      title: e.title[0],
      published: new Date(e.published[0]).toISOString(),
      link: e.link[0].$.href,
      platform,
    }))
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [{ params: { slug: [] } }, { params: { slug: ['blog'] } }],
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const yamitzky = await getAtom(
    'yamitzky',
    'https://yamitzky.hatenablog.com/feed'
  )
  const jxpress = await getAtom(
    'jxpress',
    'https://tech.jxpress.net/feed/author/yamitzky'
  )
  const qiita = await getAtom('qiita', 'https://qiita.com/yamitzky/feed')
  const note = await getAtom('note', 'https://note.com/yamitzky/rss')

  const articles = [...yamitzky, ...jxpress, ...qiita, ...note].sort((a, b) =>
    a.published > b.published ? -1 : 1
  )

  return {
    props: {
      articles,
      page: (params.slug?.[0] as any) || 'top',
    },
    revalidate: 600,
  }
}

const Home: NextPage<Props> = ({ articles, page }) => {
  return (
    <section>
      <Head>
        <title>Yamitzky / 小笠原みつき - Portofolio</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://yamitzky.com" />
      </Head>
      {page === 'top' && (
        <>
          <Profile />
          <SNS />
          <Presentation />
          <Blog articles={articles.slice(0, 6)} short />
          <Career />
          <Skill />
          <OSS />
        </>
      )}
      {page === 'blog' && (
        <>
          <Breadcrumb />
          <Presentation />
          <Blog articles={articles} />
          <Divider />
          <Profile />
        </>
      )}
    </section>
  )
}

export default Home
